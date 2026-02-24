"use client"
import React, { useState, useEffect } from 'react';
import { getBackendUrl, getExileUrl } from '@/config';
import { useRouter } from 'next/navigation';
import { PenLine, Plus, Users, Lock, RefreshCw, MessageCircle, Copy, Check, ArrowRight, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
  id: number;
  name: string;
  slug: string;
  roomCode?: string;
  createdAt: string;
  isPrivate?: boolean;
}

function Home() {
  const Router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch user's rooms on component mount
  useEffect(() => {
    fetchMyRooms();
  }, []);

  const fetchMyRooms = async () => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No auth token found");
        return;
      }

      const response = await axios.get(`${getBackendUrl()}/rooms/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMyRooms(response.data.rooms);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    if (isPrivate && !roomPassword.trim()) {
      alert("Please enter a password for private rooms");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("You are not authenticated. Please sign in.");
        return;
      }

      const response = await axios.post(
        `${getBackendUrl()}/room`,
        {
          name: roomName,
          isPrivate: isPrivate,
          password: isPrivate ? roomPassword : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const roomId = response.data.roomId;
        const roomCode = response.data.roomCode;

        if (isPrivate && roomCode) {
          alert(`Private room created successfully!\nRoom ID: ${roomId}\nRoom Code: ${roomCode}\n\nShare this code with others to join your private room.`);
        }

        setRoomName('');
        setRoomPassword('');
        setIsPrivate(false);
        fetchMyRooms(); // Refresh the rooms list
        Router.push(`${getExileUrl()}/${roomId}`);
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (error as { message?: string }).message ||
        "Something went wrong";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      alert("Please enter a room ID or code");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("You are not authenticated. Please sign in.");
      return;
    }

    try {
      setIsLoading(true);

      // Try to get room info by ID first
      const response = await axios.get(`${getBackendUrl()}/room/id/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const room = response.data.room;

        // Check if room is private and requires password
        if (room.isPrivate) {
          const password = prompt("This is a private room. Please enter the password:");
          if (!password) {
            alert("Password is required for private rooms");
            setIsLoading(false);
            return;
          }

          // Verify password
          const verifyResponse = await axios.post(`${getBackendUrl()}/room/verify-password`, {
            roomId: room.id,
            password: password
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!verifyResponse.data.success) {
            alert("Incorrect password for private room");
            setIsLoading(false);
            return;
          }
        }

        Router.push(`${getExileUrl()}/${room.id}`);
      }
    } catch {
      // If room not found by ID, try by code
      try {
        const response = await axios.get(`${getBackendUrl()}/room/code/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const room = response.data.room;

          if (room.isPrivate) {
            const password = prompt("This is a private room. Please enter the password:");
            if (!password) {
              alert("Password is required for private rooms");
              setIsLoading(false);
              return;
            }

            const verifyResponse = await axios.post(`${getBackendUrl()}/room/verify-password`, {
              roomId: room.id,
              password: password
            }, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!verifyResponse.data.success) {
              alert("Incorrect password for private room");
              setIsLoading(false);
              return;
            }
          }

          Router.push(`${getExileUrl()}/${room.id}`);
        }
      } catch {
        // If room not found by code, try by slug
        try {
          const response = await axios.get(`${getBackendUrl()}/room/${roomId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.success) {
            const room = response.data.room;

            if (room.isPrivate) {
              const password = prompt("This is a private room. Please enter the password:");
              if (!password) {
                alert("Password is required for private rooms");
                setIsLoading(false);
                return;
              }

              const verifyResponse = await axios.post(`${getBackendUrl()}/room/verify-password`, {
                roomId: room.id,
                password: password
              }, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!verifyResponse.data.success) {
                alert("Incorrect password for private room");
                setIsLoading(false);
                return;
              }
            }

            Router.push(`${getExileUrl()}/${room.id}`);
          }
        } catch (slugError: unknown) {
          const errorMessage = (slugError as { response?: { data?: { message?: string } } }).response?.data?.message || "Room not found";
          alert(`Error: ${errorMessage}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomById = (roomId: number) => {
    Router.push(`${getExileUrl()}/${roomId}`);
  };

  const copyRoomCode = (e: React.MouseEvent, code: string, id: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen relative bg-zinc-950 text-white overflow-hidden selection:bg-purple-500/30">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-xl">
                <PenLine className="h-10 w-10 text-white" />
              </div>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 mb-4 tracking-tight"
          >
            Collaborative Drawing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto"
          >
            Create a new workspace or join an existing session to collaborate with your team in real-time.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create & Join Room Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-purple-500" />
                Create Room
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-zinc-400 text-sm font-medium mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Brainstorming Session"
                    className="w-full bg-zinc-950/50 border border-zinc-800 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsPrivate(false)}
                    className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${!isPrivate
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-zinc-950/30 border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Users className={`w-5 h-5 ${!isPrivate ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className={`font-semibold ${!isPrivate ? 'text-white' : 'text-zinc-400'}`}>Public</span>
                    </div>
                    <p className="text-xs text-zinc-500">Accessible by ID</p>
                    {!isPrivate && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    )}
                  </button>

                  <button
                    onClick={() => setIsPrivate(true)}
                    className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${isPrivate
                      ? 'bg-purple-500/10 border-purple-500/50'
                      : 'bg-zinc-950/30 border-zinc-800 hover:border-zinc-700'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className={`w-5 h-5 ${isPrivate ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className={`font-semibold ${isPrivate ? 'text-white' : 'text-zinc-400'}`}>Private</span>
                    </div>
                    <p className="text-xs text-zinc-500">Secured with Password</p>
                    {isPrivate && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {isPrivate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-zinc-400 text-sm font-medium mb-2">Room Password</label>
                      <input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950/50 border border-zinc-800 text-white px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none placeholder:text-zinc-600"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={createRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-500 hover:to-blue-500 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                >
                  <Plus className="w-5 h-5" />
                  <span>{isLoading ? 'Creating Room...' : 'Create New Room'}</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-emerald-500" />
                Join Room
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID or Code"
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-white pl-4 pr-32 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none placeholder:text-zinc-600"
                />
                <button
                  onClick={joinRoom}
                  disabled={isLoading}
                  className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? '...' : 'Join'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* My Rooms List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7 flex flex-col h-full"
          >
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">My Rooms</h2>
                  <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-xs font-medium">
                    {myRooms.length}
                  </span>
                </div>
                <button
                  onClick={fetchMyRooms}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-50 group"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>
              </div>

              {myRooms.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 ring-4 ring-zinc-800">
                    <PenLine className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 text-lg font-medium mb-2">No rooms created yet</p>
                  <p className="text-zinc-600 max-w-sm">Create your first room to start collaborating with your team.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max overflow-y-auto pr-2 custom-scrollbar max-h-[600px]">
                  {myRooms.map((room) => (
                    <div
                      key={room.id}
                      className="group bg-zinc-950/50 border border-zinc-800/50 hover:border-purple-500/50 p-5 rounded-2xl hover:bg-zinc-900 transition-all duration-300 cursor-pointer relative overflow-hidden"
                      onClick={() => joinRoomById(room.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-purple-500/30 transition-colors">
                          <Users className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        {room.isPrivate ? (
                          <div className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-purple-500/20">
                            <Lock className="w-3 h-3" />
                            Private
                          </div>
                        ) : (
                          <div className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium border border-emerald-500/20">
                            Public
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-white mb-1 truncate pr-8 group-hover:text-purple-400 transition-colors">{room.name}</h3>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs mb-3">
                        <span>ID: {room.id}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                        <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                      </div>

                      {room.isPrivate && room.roomCode && (
                        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                          <code className="bg-zinc-950 px-2 py-1 rounded text-purple-400 text-xs font-mono tracking-wider">
                            {room.roomCode}
                          </code>
                          <button
                            onClick={(e) => copyRoomCode(e, room.roomCode!, room.id)}
                            className="text-zinc-500 hover:text-white transition-colors"
                          >
                            {copiedId === room.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Home;