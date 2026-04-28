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
      async authorize(credentials) {
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

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
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
