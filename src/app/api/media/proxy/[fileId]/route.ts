import { NextRequest, NextResponse } from 'next/server';
import { fetchDriveFileMedia, getDriveFileMetadata } from '@/lib/google/drive';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;
    if (!fileId) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const range = request.headers.get('range');
    const [mediaRes, meta] = await Promise.all([
      fetchDriveFileMedia(fileId, range),
      getDriveFileMetadata(fileId),
    ]);

    if (!mediaRes || !mediaRes.body) {
      return new NextResponse('File not found or Google Drive unavailable', { status: 404 });
    }

    const responseHeaders = new Headers();
    if (meta?.mimeType) {
      responseHeaders.set('Content-Type', meta.mimeType);
    }
    if (meta?.name) {
      responseHeaders.set('Content-Disposition', `inline; filename="${encodeURIComponent(meta.name)}"`);
    }
    if (meta?.size) {
      responseHeaders.set('Content-Length', meta.size);
    }

    const acceptRanges = mediaRes.headers.get('accept-ranges');
    if (acceptRanges) responseHeaders.set('Accept-Ranges', acceptRanges);
    const contentRange = mediaRes.headers.get('content-range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    return new NextResponse(mediaRes.body as BodyInit, {
      status: mediaRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('Media proxy error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
