import { fetchApi } from '../lib/api';
import { MembershipApplication } from '../types/ysp';

// This service used to also write directly to Firestore from the browser,
// in parallel with calling the backend API for the same data — a leftover
// dual-write path from before the backend became the single, authoritative
// writer. That direct-Firestore-from-the-client code has been removed:
// every mutation now goes through exactly one path (this -> backend API ->
// Firestore Admin SDK), which is what keeps Firestore the one true source
// of truth with no risk of the two paths disagreeing or racing.
export const CMSDataService = {
  /**
   * Approve a membership application. The backend performs this atomically:
   * marks the application Approved, inducts the applicant as an official
   * Senator, and issues their membership certificate — as explicit,
   * single-document Firestore writes.
   */
  async approveMembershipApplication(appId: string, _application: MembershipApplication): Promise<string> {
    const result = await fetchApi<{ success: boolean; application: MembershipApplication }>(
      `/applications/${appId}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status: 'Approved' })
      }
    );
    return result.application.assignedMembershipId || '';
  }
};
