import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";

import store from "./redux/store";
import { Provider } from "react-redux";

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

import Sidebar from "./components/Sidebar";
import SidebarAdmin from "./components/SidebarAdmin";

//page User
import Home from "./pages/Home";
import DocumentFlow from "./pages/DocumentFlow";
import FavoriteFlow from "./pages/FavoriteFlow";
import Progress from "./pages/Progress";
import History from "./pages/History";
import Approval from "./pages/Approval";
import Approved from "./components/Approved";
import ProgressDetail from "./pages/ProgressDetail";
import ApprovalDetail from "./pages/ApprovalDetail";

//page Admin
import HomeAdmin from "./pagesAdmin/HomeAdmin";

import MyFlow from "./pagesAdmin/MyFlow";
import CreateFlow from "./pagesAdmin/CreateFlow";
import EditFlow from "./components/EditFlow";
import Relationship from "./pagesAdmin/Relationship";
import EditRelationship from "./components/EditRelationship";
import CreateRelationship from "./pagesAdmin/CreateRelationship";
import Role from "./pagesAdmin/Role";

function App() {
  function MyRoutes() {
    return (
      <BrowserRouter>
        <Provider store={store}>
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/signUp" element={<SignUp />} />
            <Route
              path="/main/*"
              element={
                <Sidebar>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/docFlow" element={<DocumentFlow />} />
                    <Route path="/faFlow" element={<FavoriteFlow />} />
                    <Route path="/approval" element={<Approval />} />
                    <Route path="/approval/:id" element={<ApprovalDetail />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/progress/:id" element={<ProgressDetail />}/>
                    <Route path="/history" element={<History />} />
                    <Route path="/approved" element={<Approved />} />
                    
                  </Routes>
                </Sidebar>
              }
            />
            <Route
              path="/admin/*"
              element={
                <SidebarAdmin>
                  <Routes>
                    <Route path="/" element={<HomeAdmin />} />
                    
                    <Route path="/myFlow" element={<MyFlow />} />
                    <Route path="/myFlow/:id" element={<EditFlow />} />
                    <Route path="/createFlow" element={<CreateFlow />} />
                    <Route path="/relation" element={<Relationship />} />
                    <Route path="/relation/:id" element={<EditRelationship />} />
                    <Route path="/createRelation" element={<CreateRelationship />}/>
                    <Route path="/role" element={<Role />}/>
                  </Routes>
                </SidebarAdmin>
              }
            />
          </Routes>
        </Provider>
      </BrowserRouter>
    );
  }
  return (
    <div>
      <MyRoutes />
    </div>
  );
}

export default App;