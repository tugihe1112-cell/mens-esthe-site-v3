// src/pages/NewRequestPage.jsx (新規作成)

import React from 'react';
import NewReviewRequestForm from '../components/NewReviewRequestForm';

export default function NewRequestPage() {
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6">
      <NewReviewRequestForm />
    </main>
  );
}