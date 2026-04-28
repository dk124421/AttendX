import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get student profile with class info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id,
        class_id,
        classes:class_students(class:classes(id, name, department, year))
      `)
      .eq('user_id', session.user.id)
      .single()

    if (studentError || !student) {
      return new NextResponse('Student profile not found', { status: 404 })
    }

    // Build the list of classes the student is in
    const classes: any[] = student.classes?.map((cs: any) => cs.class).filter(Boolean) || []

    // Fetch attendance records for this student across all their classes
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance')
      .select('date, status, class_id, subject:subjects(name)')
      .eq('student_id', student.id)

    if (attendanceError) throw attendanceError

    // Group attendance by class_id
    const attendanceByClass: Record<string, any[]> = {}
    ;(attendanceRecords || []).forEach((record: any) => {
      const cid = record.class_id
      if (!attendanceByClass[cid]) {
        attendanceByClass[cid] = []
      }
      attendanceByClass[cid].push({
        date: record.date,
        status: record.status,
        subject: record.subject?.name || null
      })
    })

    // Build response with each class and its attendance
    const result = classes.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      department: cls.department,
      year: cls.year,
      attendance: attendanceByClass[cls.id] || [],
      totalClasses: (attendanceByClass[cls.id] || []).length,
      presentClasses: (attendanceByClass[cls.id] || []).filter((a: any) => a.status === 'PRESENT').length,
    }))

    return NextResponse.json({ classes: result })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
