import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reactionId } = await params;

    // Delete reaction
    await prisma.postReaction.delete({
      where: { id: reactionId },
    });

    console.log('❤️ Reaction deleted:', reactionId);

    return NextResponse.json(
      { success: true, message: 'Reaction removed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❤️ Error deleting reaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}
