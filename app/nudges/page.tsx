"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Clock } from "lucide-react";

interface Nudge {
  id: number;
  title: string;
  description: string;
  type: "reminder" | "tip" | "motivation";
  completed: boolean;
  dueDate?: string;
}

export default function NudgesPage() {
  // Mock nudges data - replace with actual API call later
  const [nudges] = useState<Nudge[]>([
    {
      id: 1,
      title: "Daily Reflection",
      description: "Take 5 minutes to reflect on today's training session",
      type: "reminder",
      completed: false,
      dueDate: "2024-01-15",
    },
    {
      id: 2,
      title: "Pre-Game Visualization",
      description: "Practice visualization techniques before your next game",
      type: "tip",
      completed: false,
    },
    {
      id: 3,
      title: "You're Doing Great!",
      description: "Remember all the progress you've made this week",
      type: "motivation",
      completed: true,
    },
  ]);

  const [nudgesState, setNudgesState] = useState<Nudge[]>(nudges);

  const handleComplete = (id: number) => {
    setNudgesState((prev) =>
      prev.map((nudge) =>
        nudge.id === id ? { ...nudge, completed: !nudge.completed } : nudge
      )
    );
  };

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Bell className="h-5 w-5" />;
      case "tip":
        return <Clock className="h-5 w-5" />;
      case "motivation":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNudgeColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "text-blue-600";
      case "tip":
        return "text-green-600";
      case "motivation":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const activeNudges = nudgesState.filter((n) => !n.completed);
  const completedNudges = nudgesState.filter((n) => n.completed);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nudges</h1>
        <p className="text-muted-foreground mt-1">
          Personalized reminders and tips to help you stay on track
        </p>
      </div>

      {activeNudges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active</h2>
          <div className="space-y-4">
            {activeNudges.map((nudge) => (
              <Card key={nudge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={getNudgeColor(nudge.type)}>
                        {getNudgeIcon(nudge.type)}
                      </div>
                      <div>
                        <CardTitle>{nudge.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {nudge.description}
                        </CardDescription>
                        {nudge.dueDate && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Due: {new Date(nudge.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleComplete(nudge.id)}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completedNudges.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Completed</h2>
          <div className="space-y-4">
            {completedNudges.map((nudge) => (
              <Card key={nudge.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={getNudgeColor(nudge.type)}>
                        {getNudgeIcon(nudge.type)}
                      </div>
                      <div>
                        <CardTitle className="line-through">{nudge.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {nudge.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(nudge.id)}
                    >
                      Undo
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {nudgesState.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No nudges at the moment. Check back later for personalized tips and reminders!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

