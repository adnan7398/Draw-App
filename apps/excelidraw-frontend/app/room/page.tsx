"use client"
import React, { useState } from 'react';
import { BACKEND_URL, EXCILE_URL, ROOM_URL } from '@/config';
import  {useRouter}from 'next/navigation';
import { PenLine } from 'lucide-react';
import axios from 'axios';

function Home() {
    const Router = useRouter();
    const [name, setName] = useState('');
    const [Loading,setLoading]  = useState(false);
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');
    const [slug,setSlug] = useState('');

  const  createRoom =  async (e) => {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          alert("You are not authenticated. Please sign in.");
          return;
        }
        console.log(token);
        const res = await axios.post(
          `${BACKEND_URL}/room`,
          { name: name }, 
          {
            headers: {
              Authorization: `Bearer ${token}`, // Fix: Add "Bearer " prefix
              "Content-Type": "application/json",
            },
          }
        );
        const roomId = res.data.roomId; 
        console.log(res.data.room);
        setRoomId(roomId);
        alert(`Room created successfully! Room ID: ${roomId}`);
        Router.push(`${EXCILE_URL}/${roomId}`);
      } catch (error: any) {
        alert(`Error: ${error.response?.data?.message || "Something went wrong"}`);
      } finally {
        setLoading(false);
      }
    };
    

  const joinRoom = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

        if (!slug) {
            alert("Please enter room name");
            return;
        }
    try{
        const res  = await axios.get(`${BACKEND_URL}/room/${slug}`);
        console.log("Room Successfully joined",res.data);
        Router.push(`${EXCILE_URL}/${slug}`);
    }catch(error: any){
      alert(`Error: ${error.response?.data?.message || "Something went wrong"}`);
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <PenLine className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Collaborative Drawing
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create or join a room to start drawing together
          </p>
        </div>

        <div className="mt-8 space-y-6">
            <input type="text" id="name"
                value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Enter Room Name" className= "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 "/>
          <button
            onClick={createRoom}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or join existing</span>
            </div>
          </div>

          <form onSubmit={joinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomId" className="sr-only">
                Room ID
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Enter Room ID"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;