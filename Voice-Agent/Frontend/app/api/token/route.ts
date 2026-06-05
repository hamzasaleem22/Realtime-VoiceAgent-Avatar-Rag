import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { nanoid } from 'nanoid';
import { RoomConfiguration } from '@livekit/protocol';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const clientApiKey = process.env.CLIENT_API_KEY;

    if (clientApiKey) {
      if (
        !authHeader ||
        !authHeader.startsWith('Bearer ') ||
        authHeader.slice(7) !== clientApiKey
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const roomName = body.room_name ?? `room-${nanoid()}`;
    const participantIdentity = body.participant_identity ?? `user-${nanoid()}`;
    const participantName = body.participant_name ?? 'User';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      metadata: body.participant_metadata,
      attributes: body.participant_attributes,
      ttl: '10m',
    });

    at.addGrant({ roomJoin: true, room: roomName });

    if (body.room_config) {
      at.roomConfig = RoomConfiguration.fromJson(body.room_config, {
        useProtoFieldName: true,
        ignoreUnknownFields: true,
      });
    }

    const participantToken = await at.toJwt();

    return NextResponse.json(
      { server_url: wsUrl, participant_token: participantToken },
      { status: 201 }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
