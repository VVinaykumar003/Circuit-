// "use client";
// import React, { useEffect, useState } from "react";
// import {
//   getFirestore,
//   collection,
//   addDoc,
//   onSnapshot,
//   query,
//   orderBy,
// } from "firebase/firestore";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { auth, storage, firestore } from "@/lib/firebase";  
// import Link from "next/link";
// import { Label } from "@/components/ui/label";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { getUserData } from "@/lib/getUserData";
// import UserHoverCard from "@/app/_components/UserHoverCard";
// const NotificationPage = () => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [allUsers, setAllUsers] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [message, setMessage] = useState("");
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isPublic, setIsPublic] = useState(true);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [sendersName, setSendersName] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Get the current user
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setCurrentUser(user);
//         const userDataForName = getUserData();
//         setSendersName(userDataForName.name);
//       } else {
//         setCurrentUser(null);
//       }
//     });

//     return () => unsubscribe();
//   }, [auth]);

//   // Fetch all users
// useEffect(() => {
//   const fetchUsers = async () => {
//     const res = await fetch("/api/users");
//     const data = await res.json();
//     setAllUsers(data.users);
//   };
//   fetchUsers();
// }, []);

//   // Fetch and sort notifications
//   useEffect(() => {
//     if (!currentUser) return;
// useEffect(() => {
//   if (!currentUser) return;

//   const fetchNotifications = async () => {
//     const res = await fetch(`/api/notifications?email=${currentUser.email}`);
//     const data = await res.json();
//     setNotifications(data.notifications);
//   };

//   fetchNotifications();
// }, [currentUser]);

    
//     const q = query(notificationsRef, orderBy("timestamp", "desc")); // Order by timestamp

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const userNotifications = snapshot.docs
//         .map((doc) => doc.data())
//         .filter((notification) =>
//           notification.toEmail.some(
//             (emailObj) => emailObj.email === currentUser.email
//           )
//         );
//       setNotifications(userNotifications);
//     });

//     return () => unsubscribe();
//   }, [firestore, currentUser]);

//   // Handle file upload
//   const handleFileUpload = async (file) => {
//     const storageRef = ref(storage, `uploads/${file.name}`);
//     const uploadTask = await uploadBytes(storageRef, file);
//     const fileURL = await getDownloadURL(uploadTask.ref);
//     return fileURL;
//   };

//   // Handle sending notification
//   const handleSendNotification = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     let fileURL = "No Files";
//     if (selectedFile) {
//       // fileURL = await handleFileUpload(selectedFile);
//       const formData = new FormData();
// formData.append("file", selectedFile);

// const res = await fetch("/api/upload", {
//   method: "POST",
//   body: formData,
// });

// const { url } = await res.json();

//     }

//     const toEmail = isPublic
//       ? allUsers.map((user) => ({ email: user.email, state: "unread" }))
//       : selectedUsers.map((user) => ({ email: user.email, state: "unread" }));

//     // Get the current date and time in the India region
//     const today = new Date().toLocaleDateString("en-CA", {
//       timeZone: "Asia/Kolkata",
//     });

//     const timestamp = new Date(); // Current timestamp
//     const currentUserData = allUsers.find(
//       (user) => user.email === currentUser.email
//     );
//     const fromName = currentUserData ? currentUserData.name : currentUser.email;

//     // Notification data
//     const notificationData = {
//       timestamp,
//       date: today,
//       fromEmail: currentUser.email,
//       msg: {
//         msgcontent: message,
//         source: fileURL,
//       },
//       dataTo: isPublic ? "public" : "private",
//       toEmail: toEmail,
//     };

//     // Create title and body for API call
//     const title = `New Notification from ${fromName}`;
//     const body =
//       message.length > 40 ? `${message.substring(0, 40)}...` : message;

//     // Call API for each email in toEmail array
//     const apiCalls = toEmail.map(async (recipient) => {
//       try {
//         const response = await fetch("/api/sendNotifications", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             email: recipient.email,
//             notification: {
//               title,
//               body,
//             },
//           }),
//         });
    
//         if (!response.ok) {
//           throw new Error(`Failed to send notification to ${recipient.email}`);
//         }
//       } catch (error) {
//         console.error(`Error sending notification to ${recipient.email}: `, error);
//       }
//     });
    
//     try {
//       // Wait for all API calls to finish, but continue even if some fail
//       await Promise.allSettled(apiCalls);
      
//       // Add the notification to Firestore regardless of API call outcomes
//       const notificationRef = collection(firestore, "notifications");
//       await addDoc(notificationRef, notificationData);
      
//       toast.success("Notification sent successfully!");
      
//       // Reset form fields
//       setMessage("");
//       setSelectedFile(null);
//       setSelectedUsers([]);
//       setIsPublic(true);
//     } catch (error) {
//       console.error("Error adding notification to Firestore: ", error);
//       toast.error("Error sending notification.");
//     } finally {
//       setLoading(false);
//     }
    
//   };

//   const isImage = (url) => {
//     return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(url);
//   };

//   return (
//     <div className="md:p-6 ">
//       <h1 className="text-xl font-bold md:mb-4 mb-2">Notification Page</h1>
//       <Card className="md:p-4 p-2">
//         <Tabs defaultValue="view" className="w-full">
//           <TabsList className="grid w-full grid-cols-2 mb-4">
//             <TabsTrigger value="view">View Notifications</TabsTrigger>
//             <TabsTrigger value="send">Send Notification</TabsTrigger>
//           </TabsList>

//           <TabsContent value="send">
//             <Card className="lg:p-6 p-3 shadow-md border border-gray-200">
//               <form onSubmit={handleSendNotification} className="space-y-4">
//                 <div>
//                   <Label htmlFor="message">Message</Label>
//                   <Textarea
//                     id="message"
//                     value={message}
//                     onChange={(e) => setMessage(e.target.value)}
//                     placeholder="Enter your message"
//                     className="w-full mt-1"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="file" className="block">
//                     Add File <span className="text-gray-400">(Optional)</span>
//                   </Label>
//                   <input
//                     id="file"
//                     type="file"
//                     onChange={(e) => setSelectedFile(e.target.files[0])}
//                     className="mt-1"
//                   />
//                 </div>

//                 <div className="flex items-center space-x-4">
//                   <Label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="dataTo"
//                       checked={isPublic}
//                       onChange={() => setIsPublic(true)}
//                       className="mr-2"
//                     />
//                     Public
//                   </Label>
//                   <Label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="dataTo"
//                       checked={!isPublic}
//                       onChange={() => setIsPublic(false)}
//                       className="mr-2"
//                     />
//                     Private
//                   </Label>
//                 </div>

//                 {!isPublic && (
//                   <div>
//                     <Label className="block mb-2">Select Users:</Label>
//                     {allUsers.map((user, index) => (
//                       <div key={index} className="flex items-center mb-2">
//                         <input
//                           type="checkbox"
//                           value={user.email}
//                           onChange={(e) => {
//                             setSelectedUsers((prevSelectedUsers) => {
//                               if (e.target.checked) {
//                                 return [...prevSelectedUsers, user];
//                               } else {
//                                 return prevSelectedUsers.filter(
//                                   (u) => u.email !== user.email
//                                 );
//                               }
//                             });
//                           }}
//                           className="mr-2"
//                         />
//                         {user.email}
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className={`px-4 py-2 rounded-md transition ${
//                     loading ? "bg-gray-400" : ""
//                   }`}
//                 >
//                   {loading ? "Sending..." : "Send"}
//                 </Button>
//               </form>
//             </Card>
//           </TabsContent>

//           <TabsContent value="view">
//       <Card className="lg:p-6 p-3 shadow-md border border-gray-200">
//         <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
//         <ul className="grid grid-cols-1 md:grid-cols-1 w-full lg:grid-cols-2 gap-2 lg:gap-5">
//           {notifications.map((notification, index) => (
//             <li key={index} className="">
//               <Card className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-400 w-full h-full">
//                 <div className="flex flex-row items-center gap-2 w-full">
//                   <div className="w-14 h-14 flex-shrink-0">
//                     <UserHoverCard email={notification.fromEmail} />
//                   </div>

//                   <div className="flex flex-col justify-center gap-0 w-0 flex-grow">
//                     <p className="overflow-hidden text-ellipsis whitespace-nowrap">
//                       {notification.fromEmail}
//                     </p>
//                     <p className="text-xs">{notification.date}</p>
//                     <p className="text-xs">{notification.dataTo}</p>
//                   </div>
//                 </div>

//                 <div className="border-b pt-2 border-slate-400 mb-2 h-1"></div>
//                 <p className="">
//                   Message: {notification.msg.msgcontent}
//                 </p>
//                 {notification.msg.source !== "No Files" &&
//                   (notification.msg.source.includes(".jpg") ||
//                   notification.msg.source.includes(".jpeg") ||
//                   notification.msg.source.includes(".png") ? (
//                     <div className="flex justify-center items-center mt-2">
//                       {notification ? (
//                         <img
//                           src={notification.msg.source}
//                           alt="Notification file"
//                           width={200}
//                           height={150}
//                           className="rounded-lg object-cover"
//                         />
//                       ) : (
//                         <Image
//                           src={"/loadingImg.jpg"}
//                           alt="Notification file"
//                           width={200}
//                           height={150}
//                           className="rounded-lg object-cover"
//                         />
//                       )}
//                     </div>
//                   ) : (
//                     <Link
//                       href={notification.msg.source}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline mt-2"
//                     >
//                       View File
//                     </Link>
//                   ))}
//               </Card>
//             </li>
//           ))}
//         </ul>
//       </Card>
//     </TabsContent>
//         </Tabs>
//       </Card>
//       <ToastContainer />
//     </div>
//   );
// };

// export default NotificationPage;
