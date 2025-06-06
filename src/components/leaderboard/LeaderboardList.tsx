'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CardDescription } from '@/components/ui/card'; // For messages like loading/no data
import { ChevronLeft, ChevronRight, Award, Star, TrendingUp } from 'lucide-react'; // Icons

interface UserLeaderboardInfo {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  points: number;
  level: number;
}

interface LeaderboardEntry {
  rank: number;
  user: UserLeaderboardInfo;
  score: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentPage: number;
  totalPages: number;
  totalEntries: number;
}

interface LeaderboardListProps {
  communityId: string;
  itemsPerPage?: number;
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ communityId, itemsPerPage = 10 }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  // const [totalEntries, setTotalEntries] = useState<number>(0); // If needed for display

  const fetchLeaderboard = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/communities/${communityId}/leaderboard?page=${page}&limit=${itemsPerPage}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch leaderboard: ${response.statusText}`);
      }
      const data: LeaderboardResponse = await response.json();
      setLeaderboardData(data.leaderboard);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      // setTotalEntries(data.totalEntries);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setLeaderboardData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [communityId, itemsPerPage]);

  useEffect(() => {
    if (communityId) {
      fetchLeaderboard(1); // Fetch initial page
    }
  }, [communityId, fetchLeaderboard]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLeaderboard(newPage);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-yellow-700" />; // Bronze
    return <span className="text-sm font-semibold">{rank}</span>;
  };


  if (isLoading && leaderboardData.length === 0) { // Show initial loading
    return <CardDescription>Loading leaderboard...</CardDescription>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Leaderboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={() => fetchLeaderboard(1)} variant="link" className="mt-2">Try Again</Button>
      </Alert>
    );
  }

  if (leaderboardData.length === 0) {
    return <CardDescription>No leaderboard data available for this community yet.</CardDescription>;
  }

  return (
    <div className="space-y-4">
      {/* Optional: Filters for period (allTime, monthly, weekly) could go here */}
      {/* For now, it's based on user.points which is typically all-time */}

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {leaderboardData.map((entry) => (
          <li key={entry.user.id} className="py-4 flex items-center space-x-4">
            <div className="w-10 text-center flex-shrink-0">{getRankIcon(entry.rank)}</div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.user.image || undefined} alt={entry.user.name || entry.user.username || 'User'} />
              <AvatarFallback>{((entry.user.name || entry.user.username || 'U')[0]).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {entry.user.name || entry.user.username || 'Anonymous User'}
              </p>
              {entry.user.username && entry.user.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{entry.user.username}</p>
              )}
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{entry.score} pts</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
              <span>Lvl {entry.user.level}</span>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
      {isLoading && leaderboardData.length > 0 && <CardDescription className="text-center py-2">Updating leaderboard...</CardDescription>}
    </div>
  );
};

export default LeaderboardList;
