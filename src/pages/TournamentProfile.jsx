import React from 'react';
import { useParams } from 'react-router-dom';

export default function TournamentProfile() {
  const { id } = useParams();

  return (
    <div className="pt-20 min-h-screen bg-[#050505] text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-orbitron font-bold text-neon mb-6">TOURNAMENT DETAILS</h1>
        <p>Tournament {id} coming soon.</p>
      </div>
    </div>
  );
}
