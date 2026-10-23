// src/app/actions.ts
'use server';

import { z } from 'zod';

export interface NewsletterFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

const EmailSchema = z.string().email({ message: 'Please enter a valid email address.' });

export async function subscribeToNewsletter(
  prevState: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  const email = formData.get('email');

  const validatedEmail = EmailSchema.safeParse(email);
  if (!validatedEmail.success) {
    return {
      status: 'error',
      message: validatedEmail.error.flatten().formErrors[0] || 'Invalid email format.',
    };
  }

  if (!process.env.BUTTONDOWN_API_KEY) {
    console.error('SERVER ERROR: BUTTONDOWN_API_KEY environment variable is not set.');
    return {
      status: 'error',
      message: 'An internal server error occurred.',
    };
  }

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      },
      // ====================================================================
      // THE FIX IS HERE: Change 'email' to 'email_address'
      // ====================================================================
      body: JSON.stringify({ email_address: validatedEmail.data }),
    });

    if (response.ok) {
      return {
        status: 'success',
        message: "You're subscribed! Check your email for a welcome message.",
      };
    }
    
    // The error handling below is fine, but the request was the issue.
    const errorData = await response.json();
    console.error(`Buttondown API Error (${response.status}):`, JSON.stringify(errorData, null, 2));

    let specificErrorMessage = '';
    if (errorData.detail) {
      specificErrorMessage = Array.isArray(errorData.detail) ? errorData.detail[0].msg : errorData.detail;
    } else if (Array.isArray(errorData.email_address)) {
      specificErrorMessage = errorData.email_address[0];
    } else if (Array.isArray(errorData) && errorData.length > 0) {
       specificErrorMessage = errorData[0];
    }

    if (specificErrorMessage.includes('already subscribed')) {
      return { status: 'error', message: 'This email address is already subscribed.' };
    }

    return {
      status: 'error',
      message: specificErrorMessage || 'Something went wrong. Please try again.',
    };

  } catch (error) {
    console.error('Newsletter subscription fetch failed:', error);
    return {
      status: 'error',
      message: 'An unexpected error occurred. Could not connect to the subscription service.',
    };
  }
}