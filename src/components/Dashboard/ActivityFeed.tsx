import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Sparkles, Check, Clock, Trophy, Award, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ActivityItem, UserProfile } from '../../types';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ActivityFeedProps {
  onShowToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ onShowToast }) => {
  const { currentUser, userProfile } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [searchUsername, setSearchUsername] = useState<string>('');
  const [addingFriend, setAddingFriend] = useState<boolean>(false);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(true);

  // Load friends
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friendships'),
      where('user1', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fList: string[] = [];
      snapshot.docs.forEach((d) => {
        fList.push(d.data().user2);
      });
      setFriends(fList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load activity feed
  useEffect(() => {
    const q = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: ActivityItem[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          userId: data.userId,
          username: data.username,
          userDisplayName: data.userDisplayName,
          userPhotoURL: data.userPhotoURL,
          type: data.type,
          text: data.text,
          createdAt: data.createdAt,
        });
      });
      setActivities(items);
      setLoadingFeed(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim() || !currentUser) return;

    const cleanName = searchUsername.trim().toLowerCase();
    if (cleanName === userProfile?.username) {
      onShowToast('error', 'You cannot add yourself as a peer.');
      return;
    }

    setAddingFriend(true);
    try {
      const usernameDoc = await getDocs(
        query(collection(db, 'usernames'), where('__name__', '==', cleanName))
      );

      if (usernameDoc.empty) {
        onShowToast('error', `Student @${cleanName} was not found.`);
        return;
      }

      const targetUid = usernameDoc.docs[0].data().uid;
      const friendshipId = `f_${currentUser.uid}_${targetUid}`;

      await setDoc(doc(db, 'friendships', friendshipId), {
        user1: currentUser.uid,
        user2: targetUid,
        createdAt: new Date().toISOString(),
      });

      onShowToast('success', `Added @${cleanName} to your peer network!`);
      setSearchUsername('');
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Failed to add peer.');
    } finally {
      setAddingFriend(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Peer Network Connection Box */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow transition-all space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Peer Network
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
            {friends.length} {friends.length === 1 ? 'Peer' : 'Peers'}
          </span>
        </div>

        <form onSubmit={handleAddFriend} className="flex gap-2">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Add peer by username..."
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 text-gray-900 text-xs rounded-xl px-3 py-2 outline-none transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={addingFriend || !searchUsername.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-all shadow-2xs flex items-center gap-1 shrink-0 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Activity Feed Container */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow transition-all space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Community Activity
        </h3>

        {loadingFeed ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No activity logged yet. Apply to internships or optimize your CV to share progress!
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {activities.map((act) => {
              const isOffer = act.type === 'offer';
              const isCv = act.type === 'cv_improved';

              return (
                <div
                  key={act.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 transition-colors"
                >
                  {/* User Avatar */}
                  <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 overflow-hidden shrink-0 mt-0.5">
                    {act.userPhotoURL ? (
                      <img src={act.userPhotoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      act.userDisplayName?.charAt(0) || 'S'
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-gray-900 truncate">
                        {act.userDisplayName}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-0.5 leading-snug">
                      {act.text}
                    </p>

                    {/* Badge Pill */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {isOffer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-emerald-500" /> Offer Secured
                        </span>
                      )}
                      {isCv && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3 text-blue-500" /> CV Upgraded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
