import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyApiAuth } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    const { orgId, courtId } = await params;

    const images = await prisma.courtImage.findMany({
      where: {
        court: {
          id: courtId,
          organizationId: orgId,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const body = await request.json();
    const { images } = body;

    // Verify court exists and belongs to org
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Get current image count
    const existingCount = await prisma.courtImage.count({
      where: { courtId },
    });

    if (existingCount + images.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Save images
    const savedImages = await Promise.all(
      images.map((img: any, index: number) =>
        prisma.courtImage.create({
          data: {
            courtId,
            data: img.data,
            width: img.width,
            height: img.height,
            posX: img.posX || 0,
            posY: img.posY || 0,
            scale: img.scale || 1,
            order: existingCount + index,
          },
        })
      )
    );

    return NextResponse.json({ images: savedImages }, { status: 201 });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const { imageId } = await request.json();

    // Verify court exists and belongs to org
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Delete image
    await prisma.courtImage.delete({
      where: {
        id: imageId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; courtId: string }> }
) {
  try {
    if (!verifyApiAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, courtId } = await params;
    const body = await request.json();
    const { imageId, posX, posY, scale } = body;

    // Verify court exists and belongs to org
    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        organizationId: orgId,
      },
    });

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    // Update image
    const updatedImage = await prisma.courtImage.update({
      where: { id: imageId },
      data: {
        posX,
        posY,
        scale,
      },
    });

    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    console.error('Image update error:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}
