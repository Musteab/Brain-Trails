import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const InstitutionInfo = () => {
  const [institution, setInstitution] = useState('');
  const [program, setProgram] = useState('');
  const [year, setYear] = useState('');
  const [subjects, setSubjects] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const handleSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      // Update user profile with institution info
      await updateDoc(doc(db, 'users', user.uid), {
        institution,
        program,
        year,
        subjects
      });

      // Redirect to dashboard after saving
      navigate('/dashboard');
    }
  };

  return (
    <div>
      <h2>Institution Info</h2>
      <form onSubmit={handleSave}>
        <input
          type="text"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="Institution"
          required
        />
        <input
          type="text"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          placeholder="Program"
          required
        />
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year/Semester"
          required
        />
        <input
          type="text"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          placeholder="Subjects Enrolled"
          required
        />
        <button type="submit">Save Info</button>
      </form>
    </div>
  );
};

export default InstitutionInfo;
