import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

//redux
import { useDispatch, useSelector } from "react-redux";
import { logIn } from "../redux/slice/accountSlice";
const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function resetTextInput() {
    setEmail("");
    setPassword("");
  }

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        email: email,
        password: password,
      });

      const { status, token, data } = response.data;
      if (status === "ok") {
        // console.log(token, data);
        const userData = { token, data };
        resetTextInput();
        localStorage.setItem("userData", JSON.stringify(userData));
        alert("เข้าสู่ระบบสำเร็จ");
        //collect to redux state
        // dispatch(logIn(data));
        navigate("/main");
      } else {
        resetTextInput();
        alert("Login Fail");
      }
    } catch (err) {
      console.error("Login failed:", err.response.data.message);
    }
  };

  useEffect(() => {
    localStorage.removeItem("userData");
    navigate("/");
    return;
  }, []);
  return (
    <div>
      <div className="pageSignIn-Up">
        <div className="SignIn-UpComponent">
          <h3>เข้าสู่ระบบ</h3>
          <form>
            <label>
              <h4>อีเมลผู้ใช้งาน</h4>
              <input
                type="text"
                required={true}
                placeholder="อีเมลผู้ใช้บัญชี"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <h4>รหัสผ่าน</h4>
              <input
                type="password"
                required={true}
                value={password}
                placeholder="รหัสผ่านผู้ใช้บัญชี"
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="btn-bottom">
                <button
                  className="btn-SignUp"
                  type="button"
                  onClick={() => {
                    navigate("/signUp");
                  }}
                >
                  <p>สมัครบัญชี</p>
                </button>
                <button
                  className="btn-SignIn"
                  type="button"
                  onClick={() => handleLogin()}
                >
                  <p>เข้าสู่ระบบ</p>
                </button>
              </div>
            </label>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
