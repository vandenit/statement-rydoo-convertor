import { ServerClient } from 'postmark';

/**
 * Gets the Postmark client configured via environment variables.
 * - POSTMARK_API_TOKEN: Server API Token from Postmark
 */
function getClient(): ServerClient {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    throw new Error('POSTMARK_API_TOKEN environment variable is not set');
  }
  return new ServerClient(token);
}

export interface PostmarkTemplateVariables {
  monitor: {
    question: string;
    analysis: string;
    url: string;
    unhelpful_count?: number;
  }
}

export interface PostmarkDailyDigestVariables {
  date: string; // e.g., 'YYYY-MM-DD'
  total_checks: number;
  total_matches: number;
  total_mismatches: number;
  monitors: Array<{
    question: string;
    url: string;
    checks: number;
    matches: number;
    mismatches: number;
  }>;
}

/**
 * Sends a transactional email using Postmark templates.
 * 
 * @param to - Recipient email address (optional, defaults to WEB_WATCHER_EMAIL)
 * @param templateAlias - The alias of the template to use
 * @param templateModel - The variables to inject into the template
 * @returns true if email was sent successfully
 * @throws Error if email sending fails
 */
export async function sendTemplateEmail(
  to: string | undefined,
  templateAlias: 'change-detected' | 'status-report' | 'daily-digest',
  templateModel: PostmarkTemplateVariables | PostmarkDailyDigestVariables
): Promise<boolean> {
  const recipient = to || process.env.WEB_WATCHER_EMAIL;

  if (!recipient) {
    console.error('[Postmark] No recipient specified and WEB_WATCHER_EMAIL not set');
    throw new Error('No email recipient configured');
  }

  // The From address MUST be a verified sender signature in Postmark
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'web-watcher@localhost';

  try {
    const client = getClient();
    
    // Using sendEmailWithTemplate as documented by Postmark
    const response = await client.sendEmailWithTemplate({
      From: from,
      To: recipient,
      TemplateAlias: templateAlias,
      TemplateModel: templateModel as Record<string, any>
    });

    console.error(`[Postmark] Template ${templateAlias} sent successfully to ${recipient} (MessageID: ${response.MessageID})`);
    return true;
  } catch (error: any) {
    console.error(`[Postmark] Failed to send template ${templateAlias} to ${recipient}:`, error);
    throw error;
  }
}
