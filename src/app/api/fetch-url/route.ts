import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 获取URL内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL content' },
        { status: response.status }
      );
    }

    const html = await response.text();

    // 简单的HTML文本提取
    // 在实际项目中，你可能需要使用更复杂的解析库如 cheerio
    const content = extractTextFromHtml(html);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'No content found in the URL' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      content: content.trim(),
      url: url
    });

  } catch (error) {
    console.error('URL fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractTextFromHtml(html: string): string {
  // 移除脚本和样式标签
  let text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ') // 移除HTML标签
    .replace(/\s+/g, ' ') // 合并空白字符
    .trim();

  // 如果文本太长，截取前面部分
  if (text.length > 3000) {
    text = text.substring(0, 3000);
  }

  return text;
}