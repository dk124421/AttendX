import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const input = credentials.email;

        // 1. Try to find user directly by email (for admin)
        let { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', input)
          .single();

        // 2. If not found by email, try as Student enrollment number (student_id)
        if (!user) {
          const { data: student } = await supabase
            .from('students')
            .select('user_id')
            .eq('student_id', input)
            .single();

          if (student) {
            const { data: studentUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', student.user_id)
              .single();
            
            user = studentUser;
          }
        }

        // 3. If still not found, try as Teacher ID number (teacher_id)
        if (!user) {
          const { data: teacher } = await supabase
            .from('teachers')
            .select('user_id')
            .eq('teacher_id', input)
            .single();

          if (teacher) {
            const { data: teacherUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', teacher.user_id)
              .single();
            
            user = teacherUser;
          }
        }

        if (!user) {
          throw new Error('User not found');
        }

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          throw new Error('Account locked due to multiple failed attempts. Please try again later.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          const attempts = (user.failed_login_attempts || 0) + 1;
          
          if (attempts >= 3) {
            const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            await supabase
              .from('users')
              .update({ failed_login_attempts: attempts, locked_until: lockedUntil })
              .eq('id', user.id);
            
            // Get contact email for alert
            let contactEmail = user.email;
            if (user.role === 'teacher') {
              const { data: teacher } = await supabase.from('teachers').select('contact_email').eq('user_id', user.id).single();
              if (teacher?.contact_email) contactEmail = teacher.contact_email;
            } else if (user.role === 'student') {
              const { data: student } = await supabase.from('students').select('contact_email').eq('user_id', user.id).single();
              if (student?.contact_email) contactEmail = student.contact_email;
            }
            
            // Send security alert
            // We use dynamic import to avoid circular dependencies and next-auth issues
            const { sendSecurityAlert } = await import('./email');
            
            // req is passed from next-auth but we need to extract IP carefully
            const headers = (req as any)?.headers;
            const ip = headers?.['x-forwarded-for'] || headers?.['x-real-ip'] || 'Unknown IP';
            
            await sendSecurityAlert(user.name, contactEmail, ip);
            
            throw new Error('Account locked due to multiple failed attempts. Please try again later.');
          } else {
            await supabase
              .from('users')
              .update({ failed_login_attempts: attempts })
              .eq('id', user.id);
            throw new Error('Invalid password');
          }
        }

        // Reset failed attempts on successful login
        if (user.failed_login_attempts > 0 || user.locked_until) {
          await supabase
            .from('users')
            .update({ failed_login_attempts: 0, locked_until: null })
            .eq('id', user.id);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
}
