/**
 * Emit a Socket.io event to all clients in a show room.
 * The global `io` instance is set by the custom server (server.ts).
 */
export function emitToShow(showId: string, event: string, data: unknown) {
  if (global.io) {
    global.io.to(`show_${showId}`).emit(event, data)
  }
}
