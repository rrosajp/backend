import { Session, formatSession } from '@/db/models/Session';
import { User, formatUser } from '@/db/models/User';
import { StatusError } from '@/services/error';
import { handle } from '@/services/handler';
import { makeRouter } from '@/services/router';
import { z } from 'zod';

export const userGetRouter = makeRouter((app) => {
  app.get(
    '/users/:uid',
    {
      schema: {
        params: z.object({
          uid: z.string(),
        }),
      },
    },
    handle(async ({ auth, params, em }) => {
      await auth.assert();
      let uid = params.uid;
      if (uid === '@me') uid = auth.user.id;

      if (auth.user.id !== uid)
        throw new StatusError('Cannot access users other than yourself', 403);

      const user = await em.findOne(User, { id: uid });
      if (!user) throw new StatusError('User does not exist', 404);

      let session: Session | undefined = undefined;

      if (uid === '@me') {
        session = (await auth.getSession()) ?? undefined;
        if (!session) throw new StatusError('Session does not exist', 400);
      }

      return {
        user: formatUser(user),
        session: session ? formatSession(session) : undefined,
      };
    }),
  );
});
