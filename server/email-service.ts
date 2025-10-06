import { Resend } from 'resend';

const CEO_EMAIL = 'tafestadios@gmail.com';
let resend: Resend | null = null;

// Only initialize Resend if API key is available
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

interface EmailNotification {
  action: 'created' | 'updated' | 'deleted';
  recordType: 'equipment' | 'maintenance' | 'parts_usage' | 'operating_report' | 'spare_part';
  recordId: string;
  performedBy: string;
  details: Record<string, any>;
}

export async function sendCEONotification(notification: EmailNotification) {
  if (!resend) {
    console.log('RESEND_API_KEY not set. Email notification skipped. Configure RESEND_API_KEY to enable email alerts.');
    return;
  }

  const actionText = notification.action.toUpperCase();
  const recordTypeText = notification.recordType.replace('_', ' ').toUpperCase();

  const emailBody = `
    <h2>PartFinder SSC - Record Change Notification</h2>
    
    <p><strong>Action:</strong> ${actionText}</p>
    <p><strong>Record Type:</strong> ${recordTypeText}</p>
    <p><strong>Record ID:</strong> ${notification.recordId}</p>
    <p><strong>Performed By:</strong> ${notification.performedBy}</p>
    
    <h3>Details:</h3>
    <pre>${JSON.stringify(notification.details, null, 2)}</pre>
    
    <hr>
    <p style="color: #666; font-size: 12px;">
      This is an automated notification from PartFinder SSC. 
      Time: ${new Date().toLocaleString()}
    </p>
  `;

  try {
    await resend.emails.send({
      from: 'PartFinder SSC <notifications@resend.dev>',
      to: CEO_EMAIL,
      subject: `PartFinder SSC Alert: ${actionText} - ${recordTypeText} #${notification.recordId}`,
      html: emailBody,
    });
    console.log(`✓ Email notification sent to CEO for ${actionText} ${recordTypeText} #${notification.recordId}`);
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

// Helper function to create notification from request
export function createNotification(
  action: EmailNotification['action'],
  recordType: EmailNotification['recordType'],
  recordId: string,
  performedBy: string,
  details: Record<string, any>
): EmailNotification {
  return {
    action,
    recordType,
    recordId,
    performedBy,
    details
  };
}
