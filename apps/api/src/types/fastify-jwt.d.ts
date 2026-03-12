import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      adminId: string;
      email: string;
      role: string;
    };
    user: {
      adminId: string;
      email: string;
      role: string;
    };
  }
}
