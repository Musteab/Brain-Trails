import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Dashboard = () => {
  const [userData, setUserData] = useState({});
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, [auth, db]);

  return (
    <div>
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <p>Hi, {userData.name}</p>
      </div>
      <h1>Welcome to your Dashboard</h1>
      {/* Additional dashboard content here */}
    </div>
  );
};

export default Dashboard;
