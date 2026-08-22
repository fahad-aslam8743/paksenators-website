import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  addDoc,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fetchApi } from '../lib/api';
import { 
  SiteSettings, 
  Senator, 
  LeadershipMember, 
  EventItem, 
  NewsItem, 
  PageContent, 
  VideoItem, 
  MembershipApplication 
} from '../types/ysp';

export const CMSDataService = {
  /**
   * Generic Firestore Collection Fetch (GET all documents in a collection)
   */
  async getCollection<T>(collectionName: string): Promise<T[]> {
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (e) {
      console.warn(`Firestore getCollection error on [${collectionName}]:`, e);
      return [];
    }
  },

  /**
   * Generic Firestore Document Fetch by ID (GET)
   */
  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as T;
      }
      return null;
    } catch (e) {
      console.warn(`Firestore getDocument error on [${collectionName}/${docId}]:`, e);
      return null;
    }
  },

  /**
   * Generic Firestore Document Create/Replace (SET)
   */
  async setDocument<T extends object>(collectionName: string, docId: string, data: T): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.warn(`Firestore setDocument error on [${collectionName}/${docId}]:`, e);
    }
  },

  /**
   * Generic Firestore Document Partial Update (UPDATE)
   */
  async updateDocument<T extends object>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data as any);
    } catch (e) {
      console.warn(`Firestore updateDocument error on [${collectionName}/${docId}]:`, e);
    }
  },

  /**
   * Generic Firestore Document Delete (DELETE)
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`Firestore deleteDocument error on [${collectionName}/${docId}]:`, e);
    }
  },

  /**
   * Updates site settings in Firestore and local backend API.
   */
  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      // 1. Update Firestore
      const settingsRef = doc(db, 'settings', 'site_settings');
      await setDoc(settingsRef, settings, { merge: true });

      // 2. Update Server Backend
      const updated = await fetchApi<SiteSettings>('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });

      return updated || (settings as SiteSettings);
    } catch (error) {
      console.warn('CMSDataService: Firestore update fallback to API', error);
      const updated = await fetchApi<SiteSettings>('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      return updated || (settings as SiteSettings);
    }
  },

  /**
   * Save or Update a Leadership Member in Firestore and Server API.
   */
  async saveLeadershipMember(member: LeadershipMember): Promise<void> {
    const memberId = member.id || `lead-${Date.now()}`;
    const payload = { ...member, id: memberId };

    try {
      const ref = doc(db, 'leadership', memberId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore leadership save error:', e);
    }

    await fetchApi('/leadership', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete a Leadership Member from Firestore and Server API.
   */
  async deleteLeadershipMember(id: string): Promise<void> {
    try {
      const ref = doc(db, 'leadership', id);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore leadership delete error:', e);
    }

    await fetchApi(`/leadership/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Save or Update a Youth Senator in Firestore and Server API.
   */
  async saveSenator(senator: Senator): Promise<void> {
    const senId = senator.id || `sen-${Date.now()}`;
    const payload = { ...senator, id: senId };

    try {
      const ref = doc(db, 'senators', senId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore senator save error:', e);
    }

    await fetchApi('/senators', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete a Youth Senator from Firestore and Server API.
   */
  async deleteSenator(id: string): Promise<void> {
    try {
      const ref = doc(db, 'senators', id);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore senator delete error:', e);
    }

    await fetchApi(`/senators/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Save or Update an Event in Firestore and Server API.
   */
  async saveEvent(eventItem: EventItem): Promise<void> {
    const evtId = eventItem.id || `evt-${Date.now()}`;
    const payload = { ...eventItem, id: evtId };

    try {
      const ref = doc(db, 'events', evtId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore event save error:', e);
    }

    await fetchApi('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete an Event from Firestore and Server API.
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      const ref = doc(db, 'events', id);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore event delete error:', e);
    }

    await fetchApi(`/events/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Save or Update a News Item in Firestore and Server API.
   */
  async saveNews(newsItem: NewsItem): Promise<void> {
    const newsId = newsItem.id || `news-${Date.now()}`;
    const payload = { ...newsItem, id: newsId };

    try {
      const ref = doc(db, 'news', newsId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore news save error:', e);
    }

    await fetchApi('/news', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete a News Item from Firestore and Server API.
   */
  async deleteNews(id: string): Promise<void> {
    try {
      const ref = doc(db, 'news', id);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore news delete error:', e);
    }

    await fetchApi(`/news/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Save or Update a Page Content section in Firestore and Server API.
   */
  async savePageContent(page: PageContent): Promise<void> {
    const pageId = page.id || `page-${Date.now()}`;
    const payload = { ...page, id: pageId };

    try {
      const ref = doc(db, 'pages', pageId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore page save error:', e);
    }

    await fetchApi('/pages', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Save or Update a Video Item in Firestore and Server API.
   */
  async saveVideo(video: VideoItem): Promise<void> {
    const videoId = video.id || `vid-${Date.now()}`;
    const payload = { ...video, id: videoId };

    try {
      const ref = doc(db, 'videos', videoId);
      await setDoc(ref, payload, { merge: true });
    } catch (e) {
      console.warn('Firestore video save error:', e);
    }

    await fetchApi('/videos', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete a Video Item from Firestore and Server API.
   */
  async deleteVideo(id: string): Promise<void> {
    try {
      const ref = doc(db, 'videos', id);
      await deleteDoc(ref);
    } catch (e) {
      console.warn('Firestore video delete error:', e);
    }

    await fetchApi(`/videos/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Approve a Membership Application & Induct Senator into Firestore and Server API.
   */
  async approveMembershipApplication(appId: string, application: MembershipApplication): Promise<string> {
    const newSenatorId = `YSP-SEN-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Update Application Status
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, {
        status: 'Approved',
        paymentStatus: 'Verified',
        assignedMembershipId: newSenatorId
      });
    } catch (e) {
      console.warn('Firestore application update error:', e);
    }

    await fetchApi(`/applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'Approved',
        paymentStatus: 'Verified',
        assignedMembershipId: newSenatorId
      })
    });

    // 2. Create Senator in Firestore & Server
    const newSenator: Senator = {
      id: `sen-${Date.now()}`,
      membershipId: newSenatorId,
      name: application.fullName,
      fatherName: application.fatherName,
      designation: 'Youth Senator',
      district: application.district,
      province: application.province,
      photoUrl: application.photoUrl || '/src/assets/images/ysp_official_logo_1786441197850.jpg',
      joiningDate: new Date().toISOString().split('T')[0],
      validUntil: '2028-12-31',
      biography: application.whyJoin || 'Inducted Youth Senator',
      parliamentaryRole: 'Youth Senator',
      attendancePercentage: 100,
      sessionsAttendedCount: 0,
      eventsAttendedCount: 0,
      certificatesCount: 1,
      status: 'Active',
      email: application.email
    };

    await this.saveSenator(newSenator);

    return newSenatorId;
  }
};
