"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MeetingsPage() {
const [client, setClient] = useState(null);
const [call, setCall] = useState(null);
const [user, setUser] = useState(null);
const [role, setRole] = useState(null);
const [meetingId, setMeetingId] = useState("");
const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        // ✅ Get Stream token (cookies included automatically)
        const res = await fetch("/api/stream/token", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch Stream token");
        const data = await res.json();

        const videoClient = new StreamVideoClient({
          apiKey: data.apiKey,
          user: data.user,
          token: data.token,
        });

        setClient(videoClient);
        setUser(data.user);

        // ✅ Get user role from session
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (sessionRes.ok) {
          const s = await sessionRes.json();
          setRole(s.role);
        }

        // ✅ Fetch meeting list
        const meetingRes = await fetch("/api/meetings/list", {
          credentials: "include",
        });

        if (meetingRes.ok) {
          const meetingData = await meetingRes.json();
          if (meetingData.success) setMeetings(meetingData.meetings);
        }
      } catch (err) {
        console.error("Init Stream error:", err);
      }
    };
    init();
  }, []);

  const handleCreateMeeting = async () => {
    if (!client) return console.error("Stream client not ready yet");
    try {
      const res = await fetch("/api/meetings/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Meeting" }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Create failed");

      const newMeetingId = data.meeting.meetingId;
      const callInstance = client.call("default", newMeetingId);
      await callInstance.join({ create: true });

      setCall(callInstance);
      setMeetingId(newMeetingId);
      setMeetings((prev) => [...prev, data.meeting]);
    } catch (err) {
      console.error("Create Meeting failed:", err);
    }
  };

  const handleJoinMeeting = async (id = meetingId) => {
    if (!client) return console.error("Stream client not ready yet");
    if (!id) return alert("Enter a meeting ID");
    try {
      await fetch("/api/meetings/join", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: id }),
      });

      const callInstance = client.call("default", id);
      await callInstance.join();
      setCall(callInstance);
    } catch (err) {
      console.error("Join Meeting failed:", err);
    }
  };

  return (
    <div className="p-6">
      {client ? (
        <StreamVideo client={client}>
          {call ? (
            <StreamCall call={call}>
              <StreamTheme>
                <SpeakerLayout />
                <CallControls />
              </StreamTheme>
            </StreamCall>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-4">Meetings</h1>

              <Tabs defaultValue="join" className="w-full">
                {role !== "member" && (
                  <TabsList>
                    <TabsTrigger value="create">Create Meeting</TabsTrigger>
                    <TabsTrigger value="join">Join Meeting</TabsTrigger>
                  </TabsList>
                )}
                {role === "member" && (
                  <TabsList>
                    <TabsTrigger value="join">Join Meeting</TabsTrigger>
                  </TabsList>
                )}

                {role !== "member" && (
                  <TabsContent value="create">
                    <button
                      onClick={handleCreateMeeting}
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      Start New Meeting
                    </button>
                    {meetingId && (
                      <p className="mt-2">
                        Meeting ID: <b>{meetingId}</b> (share this with others)
                      </p>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="join">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter meeting ID"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    />
                    <button
                      onClick={() => handleJoinMeeting()}
                      className="px-4 py-2 bg-green-500 text-white rounded"
                    >
                      Join
                    </button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Your Upcoming Meetings</h2>
                {meetings.length === 0 ? (
                  <p className="text-gray-500">No meetings found</p>
                ) : (
                  <ul className="space-y-2">
                    {meetings.map((m) => (
                      <li key={m._id} className="border p-3 rounded flex justify-between">
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(m.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinMeeting(m.meetingId)}
                          className="px-3 py-1 bg-green-500 text-white rounded"
                        >
                          Join
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </StreamVideo>
      ) : (
        <p>Loading Stream client...</p>
      )}
    </div>
  );
}
