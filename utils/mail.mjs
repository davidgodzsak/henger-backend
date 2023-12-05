export async function sendEmail() {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.example.com', // Replace with your SMTP server host
      port: 587, // Common ports are 25, 587 (for TLS), or 465 (for SSL)
      secure: false, // True for 465, false for other ports
      auth: {
        user: 'your_email@example.com', // Your email
        pass: 'your_password' // Your password
      }
    });
  
    // Email options
    const mailOptions = {
      from: 'your_email@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email from Node.js',
      text: 'This is a test email sent from a Node.js application!'
    };
  
    // Send email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }