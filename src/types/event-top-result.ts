import { EventDetails } from './event-details';
import { User } from './user';
import { Club } from './club';
import { EventCategory } from './event-category';

export interface EventTopResult {
  id: string;
  eventId: string;
  categoryId: string;
  position: number;
  userId?: string | null;
  athleteName: string;
  clubId?: string | null;
  clubName?: string | null;
  result: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relações
  event?: EventDetails;
  category?: EventCategory;
  user?: User | null;
  club?: Club | null;
}

export interface CreateEventTopResultRequest {
  eventId: string;
  categoryId: string;
  position: number;
  userId?: string | null;
  athleteName: string;
  clubId?: string | null;
  clubName?: string | null;
  result: string;
}

export interface UpdateEventTopResultRequest {
  id: string;
  position?: number;
  userId?: string | null;
  athleteName?: string;
  clubId?: string | null;
  clubName?: string | null;
  result?: string;
}

export interface EventTopResultsResponse {
  data: EventTopResult[];
  message?: string;
  error?: string;
}
