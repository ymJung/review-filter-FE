'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>로드맵 상세 페이지</h1>
      <p>ID: {params.id}</p>
    </div>
  );
}
