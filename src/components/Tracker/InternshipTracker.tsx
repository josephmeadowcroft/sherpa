import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Internship, ApplicationRecord, ApplicationStatus } from "../../types";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface InternshipTrackerProps {
  onShowToast: (type: "success" | "error" | "info", text: string) => void;
}

const SEED_INTERNSHIPS: Omit<Internship, "id">[] = [
  {
    company: "Google",
    role: "Software Engineering Intern",
    programType: "Summer Internship",
    industry: "Tech",
    location: "London, UK / Hybrid",
    deadline: "15 Nov 2026",
    applyUrl: "https://careers.google.com",
    notes: "Requires algorithms & data structures coding assessment.",
    fetchedAt: new Date().toISOString(),
  },
  {
    company: "Goldman Sachs",
    role: "Investment Banking Summer Analyst",
    programType: "Summer Internship",
    industry: "Banking & Finance",
    location: "London, UK",
    deadline: "30 Nov 2026",
    applyUrl: "https://www.goldmansachs.com/careers",
    notes: "Numerical reasoning test sent automatically upon submission.",
    fetchedAt: new Date().toISOString(),
  },
  {
    company: "McKinsey & Company",
    role: "Business Analyst Graduate Scheme",
    programType: "Graduate Scheme",
    industry: "Consulting",
    location: "London, UK / Global",
    deadline: "1 Dec 2026",
    applyUrl: "https://www.mckinsey.com/careers",
    notes: "Solve It (PSG) game assessment stage.",
    fetchedAt: new Date().toISOString(),
  },
  {
    company: "Meta",
    role: "Product Management Graduate Scheme",
    programType: "Graduate Scheme",
    industry: "Tech",
    location: "London, UK",
    deadline: "20 Nov 2026",
    applyUrl: "https://www.metacareers.com",
    notes: "Focus on product sense and metric execution.",
    fetchedAt: new Date().toISOString(),
  },
];

export const InternshipTracker: React.FC<InternshipTrackerProps> = ({
  onShowToast,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<
    Record<string, ApplicationRecord>
  >({});
  const [loadingListings, setLoadingListings] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("All");
  const [selectedProgramType, setSelectedProgramType] = useState<string>("All");
  const [showMyAppsOnly, setShowMyAppsOnly] = useState<boolean>(false);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Internship | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Field States
  const [formCompany, setFormCompany] = useState<string>("");
  const [formRole, setFormRole] = useState<string>("");
  const [formProgramType, setFormProgramType] =
    useState<string>("Summer Internship");
  const [formIndustry, setFormIndustry] = useState<string>("Tech");
  const [formLocation, setFormLocation] = useState<string>("");
  const [formDeadline, setFormDeadline] = useState<string>("");
  const [formApplyUrl, setFormApplyUrl] = useState<string>("");
  const [formStatus, setFormStatus] = useState<ApplicationStatus | "">("");
  const [formNotes, setFormNotes] = useState<string>("");

  const industries = [
    "All",
    "Tech",
    "Banking & Finance",
    "Consulting",
    "Law",
    "Marketing",
    "Engineering",
  ];
  const programTypes = [
    "All",
    "Summer Internship",
    "Graduate Scheme",
    "Spring Insight",
    "Off-Cycle Internship",
    "Placement Year",
  ];

  // Real-time Firestore sync for Internships
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "internships"),
      async (snapshot) => {
        if (snapshot.empty) {
          // Seed sample data if empty
          for (const seed of SEED_INTERNSHIPS) {
            const seedId = `intern_${seed.company.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await setDoc(doc(db, "internships", seedId), {
              ...seed,
              id: seedId,
            });
          }
          return;
        }

        const items: Internship[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            company: data.company || "",
            role: data.role || "",
            programType: data.programType || "Summer Internship",
            industry: data.industry || "Tech",
            location: data.location || "",
            deadline: data.deadline || "Rolling",
            applyUrl: data.applyUrl || "",
            notes: data.notes || "",
            fetchedAt: data.fetchedAt || new Date().toISOString(),
          });
        });

        // Sort latest created/updated first
        items.sort(
          (a, b) =>
            new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime(),
        );

        setInternships(items);
        setLoadingListings(false);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        setLoadingListings(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync for User's Applications
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "applications"),
      where("userId", "==", currentUser.uid),
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
          updatedAt: data.updatedAt,
        };
      });
      setApplications(appMap);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Open Form Modal (Add vs Edit)
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCompany("");
    setFormRole("");
    setFormProgramType("Summer Internship");
    setFormIndustry("Tech");
    setFormLocation("London, UK");
    setFormDeadline("30 Nov 2026");
    setFormApplyUrl("https://");
    setFormStatus("Saved");
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (item: Internship) => {
    const userApp = applications[item.id];
    setEditingItem(item);
    setFormCompany(item.company);
    setFormRole(item.role);
    setFormProgramType(item.programType || "Summer Internship");
    setFormIndustry(item.industry || "Tech");
    setFormLocation(item.location);
    setFormDeadline(item.deadline);
    setFormApplyUrl(item.applyUrl || "");
    setFormStatus(userApp?.status || "");
    setFormNotes(item.notes || "");
    setIsFormOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim() || !formRole.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const itemId = editingItem ? editingItem.id : `intern_${Date.now()}`;
      const now = new Date().toISOString();

      const internshipData: Internship = {
        id: itemId,
        company: formCompany.trim(),
        role: formRole.trim(),
        programType: formProgramType,
        industry: formIndustry,
        location: formLocation.trim() || "Remote / UK",
        deadline: formDeadline.trim() || "Rolling",
        applyUrl: formApplyUrl.trim() || "#",
        notes: formNotes.trim(),
        fetchedAt: editingItem ? editingItem.fetchedAt : now,
      };

      // Save/Update Internship document
      await setDoc(doc(db, "internships", itemId), internshipData, {
        merge: true,
      });

      // Save/Update Application status if selected
      if (formStatus) {
        await handleStatusChange(
          internshipData,
          formStatus as ApplicationStatus,
        );
      } else if (editingItem && !formStatus) {
        // If status was cleared in edit, delete application record
        const appId = `app_${currentUser.uid}_${itemId}`;
        await deleteDoc(doc(db, "applications", appId));
      }

      onShowToast(
        "success",
        editingItem
          ? "Application updated successfully!"
          : "New application added to database!",
      );

      setIsFormOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving internship:", err);
      onShowToast("error", "Failed to save application.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Internship
  const handleDeleteItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      // Delete internship document from Firestore
      await deleteDoc(doc(db, "internships", itemId));

      // Also delete application document if exists
      const appId = `app_${currentUser.uid}_${itemId}`;
      await deleteDoc(doc(db, "applications", appId));

      onShowToast("info", "Application removed from tracker.");
      setDeletingItemId(null);
    } catch (err) {
      console.error("Error deleting internship:", err);
      onShowToast("error", "Failed to delete application.");
    }
  };

  // Change Status Dropdown
  const handleStatusChange = async (
    internship: Internship,
    newStatus: ApplicationStatus,
  ) => {
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
      updatedAt: now,
    };

    await setDoc(doc(db, "applications", appId), appData);

    if (newStatus === "Applied" || newStatus === "Offer") {
      const actId = `act_${Date.now()}`;
      const activityText =
        newStatus === "Applied"
          ? `applied to ${internship.company} — ${internship.role}`
          : `received an Offer from ${internship.company}! 🎉`;

      await setDoc(doc(db, "activities", actId), {
        userId: currentUser.uid,
        username: userProfile?.username || "student",
        userDisplayName: userProfile?.displayName || "Student",
        userPhotoURL: userProfile?.photoURL || "",
        type: newStatus === "Offer" ? "offer" : "applied",
        text: activityText,
        createdAt: now,
      });

      onShowToast(
        "success",
        `Status updated: ${newStatus}! Shared with peer feed.`,
      );
    } else {
      onShowToast("info", `Status set to ${newStatus}`);
    }
  };

  const appList: ApplicationRecord[] = Object.values(applications);
  const counts = {
    Saved: appList.filter((a) => a.status === "Saved").length,
    Applied: appList.filter((a) => a.status === "Applied").length,
    Interview: appList.filter((a) => a.status === "Interview").length,
    Offer: appList.filter((a) => a.status === "Offer").length,
    Rejected: appList.filter((a) => a.status === "Rejected").length,
  };

  const filteredListings = internships.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      item.company.toLowerCase().includes(searchLower) ||
      item.role.toLowerCase().includes(searchLower) ||
      item.location.toLowerCase().includes(searchLower) ||
      (item.notes && item.notes.toLowerCase().includes(searchLower));

    const matchesIndustry =
      selectedIndustry === "All" ||
      item.industry.toLowerCase() === selectedIndustry.toLowerCase();

    const matchesProgram =
      selectedProgramType === "All" ||
      (item.programType &&
        item.programType.toLowerCase() === selectedProgramType.toLowerCase());

    const userApp = applications[item.id];
    const matchesMyApps = !showMyAppsOnly || Boolean(userApp);

    return matchesSearch && matchesIndustry && matchesProgram && matchesMyApps;
  });

  const getStatusBadgeStyle = (status?: ApplicationStatus) => {
    switch (status) {
      case "Applied":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Interview":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Offer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Saved":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-white text-gray-600 border-gray-200 hover:bg-gray-50";
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Pipeline Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Saved", count: counts.Saved, dotColor: "bg-gray-400" },
          { label: "Applied", count: counts.Applied, dotColor: "bg-blue-600" },
          {
            label: "Interview",
            count: counts.Interview,
            dotColor: "bg-amber-500",
          },
          { label: "Offer", count: counts.Offer, dotColor: "bg-emerald-500" },
          {
            label: "Rejected",
            count: counts.Rejected,
            dotColor: "bg-rose-500",
          },
        ].map((st) => (
          <div
            key={st.label}
            className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs"
          >
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {st.label}
              </span>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {st.count}
              </p>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${st.dotColor}`} />
          </div>
        ))}
      </div>

      {/* Control Bar: Search, Add Application Button, Filter Controls */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company, role title, location, or notes..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowMyAppsOnly(!showMyAppsOnly)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                showMyAppsOnly
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> My Apps Only
            </button>

            {/* Add Application Button */}
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Application</span>
            </button>
          </div>
        </div>

        {/* Industry and Program Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-3">
          {/* Industry Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 mr-1">
              Industry:
            </span>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setSelectedIndustry(ind)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedIndustry === ind
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* Program Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 mr-1">
              Type:
            </span>
            {programTypes.map((pt) => (
              <button
                key={pt}
                onClick={() => setSelectedProgramType(pt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedProgramType === pt
                    ? "bg-blue-50 text-blue-700 border border-blue-200 font-semibold"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {pt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Table / Cards */}
      {loadingListings ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 border border-gray-200 rounded-2xl p-5 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center text-gray-500 space-y-3 shadow-2xs">
          <GraduationCap className="w-8 h-8 text-blue-500 mx-auto opacity-80" />
          <p className="text-sm font-semibold text-gray-900">
            No applications found matching your filters.
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Click{" "}
            <span
              className="text-blue-600 font-semibold cursor-pointer"
              onClick={handleOpenAddModal}
            >
              "+ Add Application"
            </span>{" "}
            to create a new internship or graduate scheme record.
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
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 text-blue-600 font-bold text-base mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.company}
                      </h4>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {item.programType || "Summer Internship"}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                        {item.industry}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-800">
                      {item.role}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />{" "}
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />{" "}
                        Deadline: {item.deadline}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 mt-1.5 inline-block">
                        <span className="font-semibold text-gray-600">
                          Note:
                        </span>{" "}
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Dropdown, External Apply, Edit & Delete Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {/* Status Dropdown Selector */}
                  <div className="relative">
                    <select
                      value={currentStatus || ""}
                      onChange={(e) =>
                        handleStatusChange(
                          item,
                          e.target.value as ApplicationStatus,
                        )
                      }
                      className={`appearance-none font-semibold text-xs rounded-xl px-3 py-2 pr-7 border cursor-pointer outline-none transition-all ${getStatusBadgeStyle(
                        currentStatus,
                      )}`}
                    >
                      <option
                        value=""
                        disabled
                        className="bg-white text-gray-400"
                      >
                        Set Status
                      </option>
                      <option value="Saved" className="bg-white text-gray-700">
                        Saved
                      </option>
                      <option
                        value="Applied"
                        className="bg-white text-blue-700"
                      >
                        Applied
                      </option>
                      <option
                        value="Interview"
                        className="bg-white text-amber-800"
                      >
                        Interview
                      </option>
                      <option
                        value="Offer"
                        className="bg-white text-emerald-700"
                      >
                        Offer 🎉
                      </option>
                      <option
                        value="Rejected"
                        className="bg-white text-rose-700"
                      >
                        Rejected
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none opacity-60" />
                  </div>

                  {/* External Apply Button */}
                  {item.applyUrl && item.applyUrl !== "#" && (
                    <a
                      href={item.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors border border-gray-200 flex items-center gap-1"
                      title="Open application link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-600 transition-colors border border-gray-200"
                    title="Edit listing details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeletingItemId(item.id)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors border border-gray-200"
                    title="Delete listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT APPLICATION MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {editingItem ? (
                  <Edit2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <Plus className="w-4 h-4 text-blue-600" />
                )}
                {editingItem
                  ? "Edit Application Record"
                  : "Add New Internship / Graduate Scheme"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
              {/* Company & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Google, J.P. Morgan"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="e.g. Software Engineering Intern"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Program Type & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Program Type
                  </label>
                  <select
                    value={formProgramType}
                    onChange={(e) => setFormProgramType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                  >
                    <option value="Summer Internship">Summer Internship</option>
                    <option value="Graduate Scheme">Graduate Scheme</option>
                    <option value="Spring Insight">Spring Insight</option>
                    <option value="Off-Cycle Internship">
                      Off-Cycle Internship
                    </option>
                    <option value="Placement Year">Placement Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Industry
                  </label>
                  <select
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Law">Law</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>

              {/* Location & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. London, UK / Hybrid"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="text"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    placeholder="e.g. 30 Nov 2026 or Rolling"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Application Link & My Pipeline Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Application URL
                  </label>
                  <input
                    type="url"
                    value={formApplyUrl}
                    onChange={(e) => setFormApplyUrl(e.target.value)}
                    placeholder="https://company.com/apply"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    My Pipeline Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as ApplicationStatus | "")
                    }
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl px-3 py-2.5 outline-none font-semibold text-blue-700"
                  >
                    <option value="">Not Tracking Yet</option>
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer 🎉</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Notes / Interview Tips / Requirements
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Coding assessment completed, referral link used, salary £45k..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 text-xs rounded-xl p-3 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingItem ? "Save Changes" : "Create Application"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs font-sans">
          <div className="w-full max-w-sm bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delete Application?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently remove this internship record and your
                saved pipeline status from the database.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingItemId(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(deletingItemId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-2xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
