import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Briefcase, 
  Calendar, 
  Building2, 
  MapPin, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Internship, ApplicationRecord, ApplicationStatus } from '../../types';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  setDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface InternshipTrackerProps {
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const InternshipTracker: React.FC<InternshipTrackerProps> = ({ onShowToast }) => {
  const { currentUser, userProfile } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Record<string, ApplicationRecord>>({});
  const [loadingListings, setLoadingListings] = useState<boolean>(true);
  const [fetchingSearch, setFetchingSearch] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [showMyAppsOnly, setShowMyAppsOnly] = useState<boolean>(false);

  const industries = ['All', 'Tech', 'Banking & Finance', 'Consulting', 'Law', 'Marketing', 'Engineering'];

  // Fetch cached internships from Firestore
  const loadInternshipsFromFirestore = async () => {
    setLoadingListings(true);
    try {
      const snap = await getDocs(collection(db, 'internships'));
      const items: Internship[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          company: data.company,
          role: data.role,
          industry: data.industry,
          location: data.location,
          deadline: data.deadline,
          applyUrl: data.applyUrl,
          fetchedAt: data.fetchedAt || new Date().toISOString()
        });
      });

      if (items.length > 0) {
        setInternships(items);
        setLoadingListings(false);
      } else {
        await fetchFreshListingsWithGemini('Technology & Finance');
      }
    } catch (err) {
      console.error(err);
      setLoadingListings(false);
    }
  };

  // Fetch fresh listings from backend
  const fetchFreshListingsWithGemini = async (industryTarget?: string) => {
    setFetchingSearch(true);
    try {
      const res = await fetch('/api/fetch-internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIndustry: industryTarget || userProfile?.targetRoles?.join(', ') || 'Technology & Business',
          country: 'UK & Global'
        })
      });

      if (!res.ok) throw new Error('Search API failed');
      const data = await res.json();
      const freshItems: Internship[] = data.listings || [];

      for (const item of freshItems) {
        const itemDocId = item.id || `intern_${item.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
        await setDoc(doc(db, 'internships', itemDocId), {
          ...item,
          id: itemDocId,
          fetchedAt: new Date().toISOString()
        });
      }

      const snap = await getDocs(collection(db, 'internships'));
      const reloaded: Internship[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        reloaded.push({
          id: d.id,
          company: data.company,
          role: data.role,
          industry: data.industry,
          location: data.location,
          deadline: data.deadline,
          applyUrl: data.applyUrl,
          fetchedAt: data.fetchedAt
        });
      });

      setInternships(reloaded);
      onShowToast('success', `Updated listings via Gemini Search Grounding!`);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Failed to refresh search grounding listings.');
    } finally {
      setFetchingSearch(false);
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'applications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appMap: Record<string, ApplicationRecord> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        appMap[data.internshipId] = {
          id: d.id,
          userId: data.userId,
          internshipId: data.internshipId,
          company: data.company,
          role: data.role,
          industry: data.industry,
          location: data.location,
          deadline: data.deadline,
          applyUrl: data.applyUrl,
          status: data.status,
          updatedAt: data.updatedAt
        };
      });
      setApplications(appMap);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    loadInternshipsFromFirestore();
  }, []);

  const handleStatusChange = async (internship: Internship, newStatus: ApplicationStatus) => {
    if (!currentUser) return;

    const appId = `app_${currentUser.uid}_${internship.id}`;
    const now = new Date().toISOString();

    const appData: ApplicationRecord = {
      id: appId,
      userId: currentUser.uid,
      internshipId: internship.id,
      company: internship.company,
      role: internship.role,
      industry: internship.industry,
      location: internship.location,
      deadline: internship.deadline,
      applyUrl: internship.applyUrl,
      status: newStatus,
      updatedAt: now
    };

    await setDoc(doc(db, 'applications', appId), appData);

    if (newStatus === 'Applied' || newStatus === 'Offer') {
      const actId = `act_${Date.now()}`;
      const activityText = newStatus === 'Applied' 
        ? `applied to ${internship.company} — ${internship.role}`
        : `received an Offer from ${internship.company}! 🎉`;

      await setDoc(doc(db, 'activities', actId), {
        userId: currentUser.uid,
        username: userProfile?.username || 'student',
        userDisplayName: userProfile?.displayName || 'Student',
        userPhotoURL: userProfile?.photoURL || '',
        type: newStatus === 'Offer' ? 'offer' : 'applied',
        text: activityText,
        createdAt: now
      });

      onShowToast('success', `Status updated: ${newStatus}! Broadcasted to peer activity feed.`);
    } else {
      onShowToast('info', `Status set to ${newStatus}`);
    }
  };

  const appList: ApplicationRecord[] = Object.values(applications);
  const counts = {
    Saved: appList.filter((a) => a.status === 'Saved').length,
    Applied: appList.filter((a) => a.status === 'Applied').length,
    Interview: appList.filter((a) => a.status === 'Interview').length,
    Offer: appList.filter((a) => a.status === 'Offer').length,
    Rejected: appList.filter((a) => a.status === 'Rejected').length,
  };

  const filteredListings = internships.filter((item) => {
    const matchesSearch =
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndustry =
      selectedIndustry === 'All' || item.industry.toLowerCase().includes(selectedIndustry.toLowerCase());

    const userApp = applications[item.id];
    const matchesMyApps = !showMyAppsOnly || Boolean(userApp);

    return matchesSearch && matchesIndustry && matchesMyApps;
  });

  const getStatusBadgeStyle = (status?: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interview':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Offer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Saved':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Pipeline Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Saved', count: counts.Saved, dotColor: 'bg-gray-400' },
          { label: 'Applied', count: counts.Applied, dotColor: 'bg-blue-600' },
          { label: 'Interview', count: counts.Interview, dotColor: 'bg-amber-500' },
          { label: 'Offer', count: counts.Offer, dotColor: 'bg-emerald-500' },
          { label: 'Rejected', count: counts.Rejected, dotColor: 'bg-rose-500' },
        ].map((st) => (
          <div
            key={st.label}
            className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs"
          >
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {st.label}
              </span>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{st.count}</p>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${st.dotColor}`} />
          </div>
        ))}
      </div>

      {/* Control Bar: Search, Industry Tabs, Refresh button */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search companies, roles, locations..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowMyAppsOnly(!showMyAppsOnly)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                showMyAppsOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> My Saved Apps Only
            </button>

            <button
              onClick={() => fetchFreshListingsWithGemini(selectedIndustry)}
              disabled={fetchingSearch}
              title="Refresh search with Gemini Google Search Grounding"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-2xs flex items-center gap-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingSearch ? 'animate-spin' : ''}`} />
              <span>{fetchingSearch ? 'Searching Web...' : 'Live Search Grounding'}</span>
            </button>
          </div>
        </div>

        {/* Industry Category Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-gray-100 pt-3">
          <span className="text-[11px] font-semibold text-gray-400 shrink-0 mr-1">
            Category:
          </span>
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedIndustry === ind
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table / Skeleton Rows */}
      {loadingListings ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 border border-gray-200 rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 space-y-3 shadow-2xs">
          <Sparkles className="w-8 h-8 text-blue-500 mx-auto opacity-80" />
          <p className="text-sm font-semibold text-gray-900">No listings match your search criteria.</p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your filters or click <span className="text-blue-600 font-medium">Live Search Grounding</span> to scan for fresh open roles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((item) => {
            const userApp = applications[item.id];
            const currentStatus = userApp?.status;

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200/80 hover:border-gray-300 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                {/* Company & Role Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 text-blue-600 font-bold text-lg">
                    <Building2 className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.company}
                      </h4>
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                        {item.industry}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-gray-700">{item.role}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> Deadline: {item.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown & Apply Action */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {/* Status Dropdown Selector */}
                  <div className="relative">
                    <select
                      value={currentStatus || ''}
                      onChange={(e) => handleStatusChange(item, e.target.value as ApplicationStatus)}
                      className={`appearance-none font-semibold text-xs rounded-xl px-3.5 py-2 pr-8 border cursor-pointer outline-none transition-all ${getStatusBadgeStyle(
                        currentStatus
                      )}`}
                    >
                      <option value="" disabled className="bg-white text-gray-400">
                        Select Status
                      </option>
                      <option value="Saved" className="bg-white text-gray-700">
                        Saved
                      </option>
                      <option value="Applied" className="bg-white text-blue-700">
                        Applied
                      </option>
                      <option value="Interview" className="bg-white text-amber-800">
                        Interview
                      </option>
                      <option value="Offer" className="bg-white text-emerald-700">
                        Offer 🎉
                      </option>
                      <option value="Rejected" className="bg-white text-rose-700">
                        Rejected
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none opacity-60" />
                  </div>

                  {/* Apply External Button */}
                  <a
                    href={item.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-gray-200"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
