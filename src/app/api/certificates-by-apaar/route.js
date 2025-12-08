import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In-memory cache for frequently accessed APAAR IDs
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const MAX_CACHE_SIZE = 1000; // Limit cache size

// Cache cleanup on interval
if (typeof global.cacheCleanupInterval === 'undefined') {
  global.cacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

/**
 * GET /api/certificates-by-apaar
 * High-performance API to fetch certificate URLs by APAAR ID
 * Query parameters: 
 *   - apaarId (required): The APAAR ID to search for
 *   - fields (optional): 'urls' for URLs only, 'full' for detailed data (default: 'urls')
 *   - nocache (optional): Set to '1' to bypass cache
 * 
 * Example: /api/certificates-by-apaar?apaarId=ABC123456&fields=urls
 */
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const apaarId = searchParams.get('apaarId');
    const fields = searchParams.get('fields') || 'urls';
    const noCache = searchParams.get('nocache') === '1';
    
    // Validate apaarId parameter
    if (!apaarId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required parameter: apaarId" 
        }, 
        { status: 400 }
      );
    }
    
    const trimmedApaarId = apaarId.trim();
    const cacheKey = `${trimmedApaarId}:${fields}`;
    
    // Check cache first (unless nocache is set)
    if (!noCache && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      const age = Date.now() - cachedData.timestamp;
      
      if (age < CACHE_TTL) {
        return NextResponse.json({
          ...cachedData.data,
          cached: true,
          cacheAge: Math.round(age / 1000)
        }, {
          headers: {
            'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
            'X-Cache': 'HIT',
            'X-Response-Time': `${Date.now() - startTime}ms`
          }
        });
      } else {
        cache.delete(cacheKey);
      }
    }
    
    // Optimize query based on requested fields
    let certificates;
    
    if (fields === 'urls') {
      // Minimal query - only fetch URLs for maximum performance
      certificates = await prisma.certificate.findMany({
        where: {
          apaarId: trimmedApaarId
        },
        select: {
          url: true
        }
      });
      
      const responseData = {
        success: true,
        apaarId: trimmedApaarId,
        totalCertificates: certificates.length,
        certificateUrls: certificates.map(cert => cert.url),
        cached: false
      };
      
      // Store in cache
      if (cache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      
      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'MISS',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
      
    } else {
      // Full query with all details
      certificates = await prisma.certificate.findMany({
        where: {
          apaarId: trimmedApaarId
        },
        select: {
          certificateId: true,
          url: true,
          name: true,
          courseName: true,
          year: true,
          createdAt: true,
          organisation: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      const responseData = {
        success: true,
        apaarId: trimmedApaarId,
        totalCertificates: certificates.length,
        certificateUrls: certificates.map(cert => cert.url),
        certificates: certificates.map(cert => ({
          certificateId: cert.certificateId,
          url: cert.url,
          name: cert.name,
          courseName: cert.courseName,
          organisationName: cert.organisation?.name,
          year: cert.year,
          issuedAt: cert.createdAt
        })),
        cached: false
      };
      
      // Store in cache
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      
      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Cache': 'MISS',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }
    
  } catch (error) {
    console.error("Error fetching certificates by APAAR ID:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      }, 
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      }
    );
  }
}
