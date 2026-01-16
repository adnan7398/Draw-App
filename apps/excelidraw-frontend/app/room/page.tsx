"use client"
import React, { useState, useEffect } from 'react';
import { getBackendUrl, getExileUrl } from '@/config';
import { useRouter } from 'next/navigation';
import { PenLine, Plus, Users, Lock, RefreshCw, MessageCircle } from 'lucide-react';
import axios from 'axios';

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
        } else {
          alert(`Room created successfully! Room ID: ${roomId}`);
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
        // If room not found by code, try by slug
        try {
          const response = await axios.get(`${getBackendUrl()}/room/${roomId}`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <PenLine className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Collaborative Drawing</h1>
          <p className="text-gray-600">Create or join a room to start drawing together</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Create or Join Room */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Create or Join Room</h2>
            
            {/* Create New Room Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Room</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter Room Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Public (ID only)</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Private (ID + Password)</span>
                    </div>
                  </label>
                </div>

                {isPrivate && (
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Enter Password (for private rooms)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                )}

                <button
                  onClick={createRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  <span>{isLoading ? 'Creating...' : 'Create Room'}</span>
                </button>
              </div>
            </div>

            {/* Join Existing Room Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Join Existing Room</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID or Code (e.g., 123 or ABC123)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">
                  For private rooms, use the 6-character room code shared by the room creator.
                </p>
                <button
                  onClick={joinRoom}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: My Rooms */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">My Rooms</h2>
              <button
                onClick={fetchMyRooms}
                disabled={isRefreshing}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {myRooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PenLine className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No rooms created yet</p>
                <p className="text-gray-400 text-sm">Create your first room to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer"
                    onClick={() => joinRoomById(room.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500">ID: {room.id}</p>
                        {room.isPrivate && room.roomCode && (
                          <p className="text-sm text-purple-600 font-medium">Code: {room.roomCode}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Created: {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {room.isPrivate && <Lock className="w-4 h-4 text-purple-500" />}
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Icons */}
        <div className="fixed bottom-6 left-6">
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-yellow-400 rounded-sm"></div>
          </div>
        </div>

        <div className="fixed bottom-6 right-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <PenLine className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;