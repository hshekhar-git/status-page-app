# 🚀 Status Page Application

A real-time status page with **Go backend** + **Next.js frontend** and **WebSocket updates**.

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **🏠 Homepage** | [https://status.hshekhar.com](https://status.hshekhar.com) |
| **📊 Dashboard** | [https://status.hshekhar.com/dashboard](https://status.hshekhar.com/dashboard) |
| **🌍 Public Status** | [https://status.hshekhar.com/status/demo](https://status.hshekhar.com/status/demo) |

## 🧪 Quick Testing

### **1. Check Real-time Connection**
- **Open:** [https://status.hshekhar.com/status/demo](https://status.hshekhar.com/status/demo)
- **Look for:** Green **"Live Updates"** indicator (top-right)
- **Open console (F12)** to see WebSocket messages

### **2. Set Up Dashboard**
- **Go to:** [https://status.hshekhar.com](https://status.hshekhar.com)
- **Click:** "Get Started" → Sign up with email
- **Access:** Dashboard automatically opens

### **3. Test Real-time Updates**

**Setup:** Open 2 tabs:
- **Tab 1:** [Dashboard Services](https://status.hshekhar.com/dashboard/services)
- **Tab 2:** [Public Status](https://status.hshekhar.com/status/demo) (with console open)

**Test Flow:**
1. **Create Service:** Tab 1 → "Add Service" → Fill form → Submit
   - ✅ **Result:** Service appears instantly on Tab 2
2. **Change Status:** Tab 1 → Change service to "Major Outage" → Update
   - ✅ **Result:** Status turns red instantly on Tab 2
3. **Create Incident:** Tab 1 → Go to Incidents → "Report Incident" → Submit
   - ✅ **Result:** Red incident alert appears instantly on Tab 2
4. **Delete Service:** Tab 1 → Click trash icon → Confirm
   - ✅ **Result:** Service disappears instantly from Tab 2

## ✅ Success Criteria

Your app works correctly when:

- 🟢 **WebSocket shows "Live Updates"** on public page
- ⚡ **All changes appear instantly** without refresh
- 📱 **Console shows WebSocket messages** for each action
- 🔄 **Multiple tabs stay synchronized**

## 🎯 Key Features

- ✅ **Real-time updates** via WebSocket
- ✅ **Service status management** with visual indicators  
- ✅ **Incident reporting** and tracking
- ✅ **Clean UI** with ShadCN components
- ✅ **Professional deployment** on Vercel + Railway

**Perfect demonstration of modern full-stack development with real-time capabilities!** 🚀
