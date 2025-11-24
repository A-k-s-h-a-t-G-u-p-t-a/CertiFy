# CertiFy - Certificate Generation System Setup Guide

## Overview

The certificate generation system has been completely modernized to use professional AI APIs for creating authentic, high-quality certificate elements based on natural language prompts.

## Features

- **Multiple AI Providers**: Hugging Face, Pollinations AI with intelligent fallbacks
- **Smart Prompt Enhancement**: Automatically enhances user prompts for certificate-appropriate results
- **Professional Templates**: SVG-based fallback templates for guaranteed results
- **Real-time Generation**: Fast, responsive image generation with loading states
- **Error Handling**: Graceful degradation with helpful user feedback

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Python Dependencies (Optional but Recommended)

```bash
cd PythonAPI
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Get free API key from https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_your_token_here
```


```bash
npm run dev
```

## API Providers

### Primary: Hugging Face (Recommended)

- **Model**: Stable Diffusion XL
- **Quality**: Highest quality results
- **Cost**: Free tier available
- **Setup**: Requires API key
- **Get Key**: https://huggingface.co/settings/tokens

### Secondary: Pollinations AI

- **Quality**: Good quality, fast
- **Cost**: Completely free
- **Setup**: No API key required
- **Fallback**: Automatic if Hugging Face fails

### Tertiary: SVG Templates

- **Quality**: Clean, professional templates
- **Speed**: Instant generation
- **Reliability**: Always works
- **Customization**: Adapts to prompt content

## How It Works

### 1. Prompt Enhancement

User prompts are automatically enhanced with certificate-appropriate context:

- Input: "gold border"
- Enhanced: "Professional certificate design, gold border with decorative corners, elegant typography, high quality, formal document style"

### 2. Intelligent Generation

The system tries providers in order:

1. **Hugging Face**: Best quality AI generation
2. **Pollinations**: Fast AI generation
3. **SVG Template**: Guaranteed fallback

### 3. Smart Templates

SVG fallbacks analyze prompts for elements like:

- Logos and seals
- Decorative borders
- Signature areas
- Color schemes
- University contexts

## Usage Examples

### Certificate Elements You Can Generate

- "Elegant gold border with decorative corners"
- "University seal and official logo"
- "Professional signature lines and date fields"
- "Formal certificate background with watermark"
- "Academic achievement design with blue and gold"
- "Corporate training certificate layout"

### Prompt Tips

- Be specific about elements: "border", "logo", "signature"
- Mention styles: "elegant", "professional", "formal"
- Include colors: "gold", "blue", "navy"
- Add context: "university", "academic", "corporate"

## Technical Details

### API Endpoints

- `POST /api/generate` - Generate certificate element from prompt

### Response Format

```json
{
  "url": "data:image/png;base64,..." // or data:image/svg+xml;base64,...
}
```

### Error Handling

- Graceful API failures with automatic fallbacks
- User-friendly error messages with suggestions
- Timeout protection (30 seconds max)

## Troubleshooting

### No Images Generated

1. Check if `.env` exists with proper API keys
2. Verify internet connection
3. Check browser console for errors
4. Try simpler prompts

### Poor Image Quality

1. Add more specific descriptive terms
2. Use professional keywords: "elegant", "formal", "high quality"
3. Mention specific elements: "border", "seal", "typography"

### API Rate Limits

- Hugging Face: Free tier has daily limits
- Pollinations: Generally unlimited
- SVG Templates: No limits

## Security Notes

- API keys are only used server-side
- No sensitive data is sent to external APIs
- Generated images are not stored permanently
- All communication uses HTTPS

## Performance

- Average generation time: 3-15 seconds
- Fallback guarantee: Always produces result
- Client-side caching for repeated requests
- Optimized image sizes (1024x768)

---

For support or questions, check the console logs or refer to the API provider documentation.
