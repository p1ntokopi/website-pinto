export type TestimonialStatus = 'pending' | 'approved' | 'rejected';

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_role: string;
  rating: number;
  quote: string;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateTestimonialInput {
  customer_name: string;
  customer_role?: string;
  rating: number;
  quote: string;
}
