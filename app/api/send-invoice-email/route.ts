// import { NextRequest, NextResponse } from 'next/server'
// import sgMail from '@sendgrid/mail'

// sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// export async function POST(req: NextRequest) {
//   try {
//     const { to, subject, html } = await req.json()

//     if (!to || !subject || !html) {
//       return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
//     }

//     await sgMail.send({ to, from: 'your-email@domain.com', subject, html })

//     return NextResponse.json({ message: 'Email sent' })
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message ?? 'Failed to send email' }, { status: 500 })
//   }
// }
