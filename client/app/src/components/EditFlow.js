import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { MdOutlineSaveAlt } from "react-icons/md";
import { MdOutlineEdit } from "react-icons/md";
import { RiArrowGoBackFill } from "react-icons/ri";
import { AiOutlineSave } from "react-icons/ai";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FiPlusCircle } from "react-icons/fi";
import { TbTriangleInvertedFilled } from "react-icons/tb";
import { RxText } from "react-icons/rx";
import { GoFile } from "react-icons/go";
import { ImCross } from "react-icons/im";
import { PiSealCheckFill } from "react-icons/pi"; //approve
import { FiSend } from "react-icons/fi"; //send response
import { FaExchangeAlt } from "react-icons/fa";
import "../styleCss/FlowStyle.css";
import "../styleCss/MyStyle.css";

const EditFlow = () => {
  const navigate = useNavigate();
  const params = useParams();

  const [flowInfo, setFlowInfo] = useState([]); // flowModel
  const [editedFlowName, setEditedFlowName] = useState(""); //ไว้รับชื่อ flow ที่เปลี่ยนใหม่
  const [isEditName, setIsEditName] = useState(false);

  const [flowStep, setFlowStep] = useState([]); //ไว้เก็บทุกขั้นตอนของ flow นี้
  const [stepSelected, setStepSelected] = useState([]); //ไว้ทำ UI ในการเปิดปิดกล่องแก้ไขflow

  const [isEditing, setIsEditing] = useState(false); //สถานะถ้ามีการแก้ไขให้ สามารถไปกด บันทึกได้
  const [allTypeAnswer, setAllTypeAnswer] = useState([
    { label: "ข้อความ", value: "Text" },
    { label: "วันที่", value: "Date" },
    { label: "วัน เวลา", value: "Date & Time" },
  ]);
  //data Apprroval

  //ไว้ทำ UI dropdown ในการเลือกลำดับผู้ส่งที่มีความสัมพันธ์กับผู้อนุมัติ อันที่เลือกลำดับอะ
  const [listOrderOfSender, setListOrderOfSender] = useState([]);

  //ไว้ทำ UI dropdown ในการเลือกความสัมพันธ์ในขั้นตอนflowนั้นๆ
  const [listRelationship, setListRelationship] = useState([]);

  // const [filterListRoleApproval, setFilterListRoleApproval] = useState([]);
  //ไว้ทำ UI dropdown ในการเลือกผู้อนุมัติในขั้นตอนflowนั้นๆ
  const [allRole, setAllRole] = useState([]); //AllRole

  function handleAddText(index) {
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        add_Text: [
          ...updatedFlowStep[index].add_Text,
          { topic: "", type_Answer: "" },
        ],
      };
      return updatedFlowStep;
    });
  }

  function handleAddFile(index) {
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        add_Other_File: [
          ...updatedFlowStep[index].add_Other_File,
          { topic: "" },
        ],
      };
      return updatedFlowStep;
    });
  }

  function handleChangeTopicAddText(index, indexAddText, event) {
    const value = event.target.value;
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        add_Text: [
          ...updatedFlowStep[index].add_Text.slice(0, indexAddText), // slice to copy elements before the indexAddText
          {
            ...updatedFlowStep[index].add_Text[indexAddText],
            topic: value, // update the topic value
          },
          ...updatedFlowStep[index].add_Text.slice(indexAddText + 1), // slice to copy elements after the indexAddText
        ],
      };
      return updatedFlowStep;
    });
  }

  function handleChangeTopicAddFile(index, indexAddFile, event) {
    const value = event.target.value;
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        add_Other_File: [
          ...updatedFlowStep[index].add_Other_File.slice(0, indexAddFile), // slice to copy elements before the indexAddText
          {
            ...updatedFlowStep[index].add_Other_File[indexAddFile],
            topic: value, // update the topic value
          },
          ...updatedFlowStep[index].add_Other_File.slice(indexAddFile + 1), // slice to copy elements after the indexAddText
        ],
      };
      return updatedFlowStep;
    });
  }

  function handleChangeTypeAnswerAddText(index, indexAddText, event) {
    const value = event.target.value;
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        add_Text: [
          ...updatedFlowStep[index].add_Text.slice(0, indexAddText), // slice to copy elements before the indexAddText
          {
            ...updatedFlowStep[index].add_Text[indexAddText],
            type_Answer: value, // update the type value
          },
          ...updatedFlowStep[index].add_Text.slice(indexAddText + 1), // slice to copy elements after the indexAddText
        ],
      };
      return updatedFlowStep;
    });
  }

  function handleDelAddText(index, indexAddText) {
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep]; //copy
      const updatedAddText = [...updatedFlowStep[index].add_Text];
      updatedAddText.splice(indexAddText, 1); // ลบอ็อบเจ็กต์ที่ต้องการโดยใช้ indexAddText
      updatedFlowStep[index].add_Text = updatedAddText; // กำหนดค่าอาร์เรย์ add_Text ใหม่
      return updatedFlowStep;
    });
  }

  function handleDelAddFile(index, indexAddFile) {
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep]; //copy
      const updatedAddOtherFile = [...updatedFlowStep[index].add_Other_File];
      updatedAddOtherFile.splice(indexAddFile, 1); // ลบอ็อบเจ็กต์ที่ต้องการโดยใช้ indexAddText
      updatedFlowStep[index].add_Other_File = updatedAddOtherFile; // กำหนดค่าอาร์เรย์ add_Text ใหม่
      return updatedFlowStep;
    });
  }

  //เปลี่ยนชื่อ flow
  async function handleChangeNameFlow() {
    //ไว้เปลี่ยนชื่อflow ที่database
    // go to change in DB ก่อน
    const userData = JSON.parse(localStorage.getItem("userData"));
    try {
      const response = await axios.post(
        "http://localhost:5000/api/changeFlowName",
        {
          id: params.id,
          newFlowName: editedFlowName,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );

      if (response.data.status === "ok") {
        const result = response.data.updateFlow;
        setFlowInfo(result);
        setEditedFlowName(result.flow_Name);
        navigate(`/admin/myFlow/${params.id}?name=${result.flow_Name}`);
      }
      setIsEditName(false);
    } catch (error) {
      console.log("catch error :", error);
    }
  }

  //ไว้เปิดปิดกรอบ แต่ละกรอบ
  function handleStepFlowSelected2(step_ID) {
    //ไว้เซ็ตค่าว่าจะให้ขั้นตอนไหนเปิดปิด
    setStepSelected((prevStep) => {
      // ถ้า prevStep[step_ID] ยังไม่มีค่าหรือมีค่าเป็น false ให้เปลี่ยนเป็น true
      if (!prevStep[step_ID]) {
        return { ...prevStep, [step_ID]: true };
      } else {
        // ถ้า prevStep[step_ID] เป็น true ให้เปลี่ยนเป็น false
        return { ...prevStep, [step_ID]: false };
      }
    });
  }
  //กลับไปหน้าหลัก
  function handleOnClose() {
    //กลับไปหน้าแรก
    navigate("/admin/myFlow");
  }

  //บันทึกFlow
  async function handleSaveFlow() {
    //ไว้ บันทึก ขั้นตอนทั้งหมด
    console.log("Save Flow");
    try {
      const userData = JSON.parse(localStorage.getItem("userData"));
      const response = await axios.post(
        "http://localhost:5000/api/updateFlow",
        {
          allFlowStep: flowStep,
          listOrderOfSender: listOrderOfSender,
          flow_ID: params.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + userData.token,
          },
        }
      );
      const status = response.data.status;
      console.log(response.data);

      if (status === "fail" || status === "error") {
        return alert("การบันทึกผิดพลาด");
      }
    } catch (error) {
      console.log("catch error :", error);
      return 0;
    }
    setIsEditing(false);
  }

  //ไว้เปลี่ยน action หรือ ลดขั้นตอน
  function handleToChangeAction(pos) {
    setIsEditing(true);
    if (pos === "last") {
      setFlowStep((prevFlowStep) => {
        const lastIndex = prevFlowStep.length - 1;
        const updatedFlowStep = [...prevFlowStep];
        updatedFlowStep[lastIndex] = {
          flow_ID: params.id,
          step_Type: "AddAction",
          relationship_ID: "",
          step_ID: prevFlowStep[lastIndex].step_ID,
        };
        return updatedFlowStep;
      });
    } else {
      //sec last
      const updatedFlowStep = [...flowStep];
      updatedFlowStep.pop();
      // แก้ไข Object ก่อน Object สุดท้ายให้มี step_Type เป็น 'AddAction' และ step_ID เหมือนเดิม
      const indexToUpdate = updatedFlowStep.length - 1;
      updatedFlowStep[indexToUpdate] = {
        // ...updatedFlowStep[indexToUpdate],
        _id: updatedFlowStep[indexToUpdate]._id,
        step_ID: updatedFlowStep[indexToUpdate].step_ID,
        flow_ID: params.id,
        step_Type: "AddAction",
      };
      console.log("หลังจากลบ ", updatedFlowStep);
      setFlowStep(updatedFlowStep);

      setListOrderOfSender((prevListOrderOfSender) => {
        const updatedListOrderOfSender = [...prevListOrderOfSender];
        updatedListOrderOfSender.splice(updatedListOrderOfSender.length - 1, 1); // ลบ object ที่ index สุดท้าย
        // console.log(updatedListOrderOfSender);
        return updatedListOrderOfSender;
      });
    }
  }

  //ไว้เปลี่ยน action ไว้จะให้เป็น Approval หรือ SendResponse
  function handleChangeActionFlow(index, step_Type) {
    setIsEditing(true);
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      if (step_Type === "Approval") {
        const newActionStep = {
          flow_ID: params.id,
          step_ID: index + 1,
          step_Type: "AddAction",
        };

        // เพิ่ม object ใหม่ลงใน flowStep array
        updatedFlowStep.push(newActionStep);
        updatedFlowStep[index] = {
          ...updatedFlowStep[index],
          step_Type: step_Type,
          role_Approver_ID: "", // ใส่ค่าที่ต้องการเพิ่มเข้าไป
          relationship_ID: "",
        };
      } else if (step_Type === "SendResponse") {
        updatedFlowStep[index] = {
          ...updatedFlowStep[index],
          step_Type: step_Type,
        };
      }
      return updatedFlowStep;
    });
  }

  //ไว้ตอนเลือกความสัมพันธ์ในแต่ละ step ก็จะไปเซ็ตค่า relationship_ID ใน step นั้นๆ ให้เป็นอันที่เลือก
  //****อาจจะมีเปลี่ยน
  async function handleChangeRelationship(index, event) {
    // console.log("index :",index)
    setIsEditing(true);
    const selectedRelationshipID = event.target.value;
    // เลือก relationship_ID: มีค่า
    if (selectedRelationshipID) {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchRoleSenderAndRoleApprovalByRelID",
          {
            rel_ID: selectedRelationshipID,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        console.log(response.data.status);
        console.log(response.data.roleSenderInfo); //roleใหญ่
        console.log(response.data.role_Approval_ID);
        const roleSenderInfo = response.data.roleSenderInfo;
        const roleApprovalID = response.data.role_Approval_ID;

        // ถ้ามีแค่1
        if (index === 1) {
          setFlowStep((prevFlowStep) => {
            const updatedFlowStep = [...prevFlowStep];
            updatedFlowStep[index] = {
              ...updatedFlowStep[index],
              relationship_ID: selectedRelationshipID,
              role_Approver_ID: roleApprovalID,
              is_User_Select: "",
              topic_Send_To_Approve: "",
              order_Of_Sender_Role_ID: 0,
            };
            return updatedFlowStep;
          });
          const label = allRole.find(
            (role) => role._id === roleApprovalID
          )?.role_Name;
          setListOrderOfSender((prevListOrderOfSender) => {
            const updatedListOrderOfSender = [...prevListOrderOfSender];
            updatedListOrderOfSender[index] = {
              value: roleApprovalID,
              label,
            };
            // console.log(updatedListOrderOfSender);
            return updatedListOrderOfSender;
          });
        }
        // index more then 1 (Ex. index=2,3) วนลูปหาว่า listOrderOfSender หาว่ามีค่าไหนซ้ำกันไหม ถ้ามีแสดงdropdown ให้เลือก
        // ถ้าไม่ซ้ำให้ เอาวนลูป listOrderOfSender หา item.value ที่เท่ากับ response.data.roleSenderInfo._id
        // ถ้าตัวไหนเท่ากันให้ updatedFlowStep[index].order_Of_Sender_Role_ID === indexlistOrder ของตัวเงื่อนไข
        // หรือถ้าไม่มีให้ เช็คว่า item.value ที่อยู่ใน response.data.roleSenderInfo.sub_Role_ID หรือป่าว
        // ถ้าตัวไหนเท่ากันให้ updatedFlowStep[index].order_Of_Sender_Role_ID === indexlistOrder ของตัวเงื่อนไข
        else {
          const hasDuplicates = (arr) => new Set(arr).size !== arr.length;
          if (hasDuplicates(listOrderOfSender.map((item) => item.value))) {
            // มีค่าที่ซ้ำกัน
            console.log("มีค่าที่ซ้ำกัน");
            // สร้างอาร์เรย์เพื่อเก็บ index ของค่าที่ซ้ำกัน
            const duplicateIndexes = [];
            const seenValues = new Set();

            listOrderOfSender.forEach((item, index) => {
              if (seenValues.has(item.value)) {
                duplicateIndexes.push(index);
              } else {
                seenValues.add(item.value);
              }
            });

            // หา index ที่น้อยที่สุดใน duplicateIndexes
            const minIndex = Math.min(...duplicateIndexes);

            setFlowStep((prevFlowStep) => {
              const updatedFlowStep = [...prevFlowStep];
              updatedFlowStep[index] = {
                ...updatedFlowStep[index],
                relationship_ID: selectedRelationshipID,
                role_Approver_ID: roleApprovalID,
                is_User_Select: "",
                topic_Send_To_Approve: "",
                order_Of_Sender_Role_ID: minIndex-1,
              };
              return updatedFlowStep;
            });
          } else {
            // ไม่มีค่าที่ซ้ำกัน
            console.log("ไม่มีค่าที่ซ้ำกัน");
            setFlowStep((prevFlowStep) => {
              const updatedFlowStep = [...prevFlowStep];
              // Assuming you have a listOrderOfSender, iterate through it
              listOrderOfSender.forEach((item, i) => {
                if (item?.value === roleSenderInfo._id) {
                  // If the value matches, set order_Of_Sender_Role_ID to index of the matching item
                  updatedFlowStep[index].order_Of_Sender_Role_ID = i;
                } else if (roleSenderInfo.sub_Role_ID?.includes(item?.value)) {
                  // If the value is in sub_Role_ID, set order_Of_Sender_Role_ID to index of the matching item
                  updatedFlowStep[index].order_Of_Sender_Role_ID = i;
                }
              });

              // Update other properties
              updatedFlowStep[index] = {
                ...updatedFlowStep[index],
                relationship_ID: selectedRelationshipID,
                role_Approver_ID: roleApprovalID,
                is_User_Select: "",
                topic_Send_To_Approve: "",
              };

              return updatedFlowStep;
            });

            const label = allRole.find(
              (role) => role._id === roleApprovalID
            )?.role_Name;
            setListOrderOfSender((prevListOrderOfSender) => {
              const updatedListOrderOfSender = [...prevListOrderOfSender];
              updatedListOrderOfSender[index] = {
                value: roleApprovalID,
                label,
              };
              console.log(updatedListOrderOfSender);
              return updatedListOrderOfSender;
            });
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
    // เลือก relationship_ID: ไม่มี
    else {
      setFlowStep((prevFlowStep) => {
        const updatedFlowStep = [...prevFlowStep];
        updatedFlowStep[index] = {
          ...updatedFlowStep[index],
          relationship_ID: selectedRelationshipID,
          role_Approver_ID: "",
          is_User_Select: "",
          topic_Send_To_Approve: "",
          order_Of_Sender_Role_ID: "",
        };
        return updatedFlowStep;
      });

      setListOrderOfSender((prevListOrderOfSender) => {
        const updatedListOrderOfSender = [...prevListOrderOfSender];
        updatedListOrderOfSender[index] = {
          value: "",
          label: "",
        };
        return updatedListOrderOfSender;
      });
    }
  }

  //ไว้เพิ่ม order_Of_Sender_Role_ID ของแต่ละ Approval
  //คือ dropdown เลือกลำดับ
  //****อาจจะมีเปลี่ยน
  function handleChangeOrderOfSender(index, event) {
    setIsEditing(true);
    const selectOrderOfSender = event.target.value;
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        order_Of_Sender_Role_ID: selectOrderOfSender,
      };
      console.log(updatedFlowStep);
      return updatedFlowStep;
    });
  }

  //dropdown user_Role_ID
  function handleChangeUserRoleID(index, event) {
    const prevValue = flowStep[0].user_Role_ID;
    const value = event.target.value; //Role_ID
    setIsEditing(true);
    if (prevValue !== value) {
      // Update user_Role_ID in the first object
      setFlowStep((prevFlowStep) => {
        const updatedFlowStep = [...prevFlowStep];
        updatedFlowStep[0] = {
          ...updatedFlowStep[0],
          user_Role_ID: value,
        };

        // Remove objects with step_ID not equal to 0
        const filteredFlowStep = updatedFlowStep.filter(
          (item) => item.step_ID === 0
        );

        // Add a new object with step_ID equal to 1
        filteredFlowStep.push({
          step_ID: 1,
          flow_ID: params.id,
          step_Type: "AddAction",
        });

        return filteredFlowStep;
      });

      // อย่าลืมเปลี่ยน listOrder
      const label = allRole.find((role) => role._id === value)?.role_Name;
      setListOrderOfSender((prevOrderOfSender) => {
        const updateOrderOfSender = [...prevOrderOfSender];
        updateOrderOfSender[0] = {
          ...updateOrderOfSender[0],
          value: value,
          label: label,
        };
        // Remove other Object ยกเว้นObject[0]
        const filteredOrderOfSender = updateOrderOfSender.filter(
          (item, index) => index === 0
        );
        return filteredOrderOfSender;
      });
    }
    // setFlowStep((prevFlowStep) => {
    //   const updatedFlowStep = [...prevFlowStep];

    //   updatedFlowStep[0] = {
    //     ...updatedFlowStep[0],
    //     user_Role_ID: value,
    //   };
    //   return updatedFlowStep;
    // });
  }

  //ไว้เปลี่ยน topic_Send_To_Approve
  function handleChangeTopic(index, event) {
    setIsEditing(true);
    const topic = event.target.value;
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        topic_Send_To_Approve: topic,
      };
      console.log(updatedFlowStep);
      return updatedFlowStep;
    });
  }

  //ไว้เลือกว่าจะให้ user เลือกผู้อนุมัติเอง หรือว่า ให้ส่งให้Role ผู้อนุมัติทุกคน
  //อาจจะเปลี่ยน หรือเอาออก
  function handleUserSelectedOrNot(index, stateUserSelect) {
    setIsEditing(true);
    setFlowStep((prevFlowStep) => {
      const updatedFlowStep = [...prevFlowStep];
      updatedFlowStep[index] = {
        ...updatedFlowStep[index],
        is_User_Select: stateUserSelect,
      };
      console.log(updatedFlowStep);
      return updatedFlowStep;
    });
  }

  //ไว้ตอนเลือกผู้อนุมัติในแต่ละ step ของApproval ก็จะไปเซ็ตค่า role_Approver_ID ใน step นั้นๆ ให้เป็นอันที่เลือก
  //dropdown RoleApproval
  function handleChangeRoleApproval(index, event) {
    setIsEditing(true);
    const selectedRoleApprovalID = event.target.value;
    if (index === 0 && flowStep[index].relationship_ID.length !== 0) {
      setFlowStep((prevFlowStep) => {
        const updatedFlowStep = [...prevFlowStep];
        updatedFlowStep[index] = {
          ...updatedFlowStep[index],
          role_Approver_ID: selectedRoleApprovalID,
          is_User_Select:"userSelect",
          order_Of_Sender_Role_ID: 0,
        };
        return updatedFlowStep;
      });
    } else {
      setFlowStep((prevFlowStep) => {
        const updatedFlowStep = [...prevFlowStep];
        updatedFlowStep[index] = {
          ...updatedFlowStep[index],
          role_Approver_ID: selectedRoleApprovalID,
          is_User_Select:"userSelect",
        };
        return updatedFlowStep;
      });
    }

    // ถ้าเลือกผู้อนุมัติ หรือ
    if (selectedRoleApprovalID.length !== 0 || selectedRoleApprovalID !== "") {
      const label = allRole.find(
        (role) => role._id === selectedRoleApprovalID
      )?.role_Name;

      setListOrderOfSender((prevListOrderOfSender) => {
        const updatedListOrderOfSender = [...prevListOrderOfSender];
        updatedListOrderOfSender[index] = {
          value: selectedRoleApprovalID,
          label,
        };
        console.log(updatedListOrderOfSender);
        return updatedListOrderOfSender;
      });
    } else {
      setListOrderOfSender((prevListOrderOfSender) => {
        const updatedListOrderOfSender = [...prevListOrderOfSender];
        updatedListOrderOfSender[index] = {
          value: "",
          label: "",
        };
        console.log(updatedListOrderOfSender);
        return updatedListOrderOfSender;
      });
    }
  }

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  //ดึงข้อมูล relationship ทั้งหมด เมื่อ re-render setListRelationship(results);
  useEffect(() => {
    async function fetchListRelationship() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchRelationship",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const results = response.data.results;
        // console.log(results);
        if (!isEqual(results, listRelationship)) {
          // Update state only if the data is different
          setListRelationship(results);
        }

        // setListRelationship(results);
      } catch (error) {
        console.log("Catch Error :", error);
      }
    }
    fetchListRelationship();
  }, [listRelationship]);

  //ดึงข้อมูล role(ผู้อนุมัติ) ทั้งหมด เมื่อ re-render setAllRole(results);
  useEffect(() => {
    async function fetchListRoleApproval() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.get(
          "http://localhost:5000/api/fetchRoles",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        const results = response.data.results;
        // console.log(results);
        const compareFunction = (a, b) => {
          if (a.main_Role_ID && !b.main_Role_ID) {
            return 1; // นำ a ไปอยู่หลัง b
          } else if (!a.main_Role_ID && b.main_Role_ID) {
            return -1; // นำ a ไปอยู่หน้า b
          } else {
            // เมื่อทั้ง a และ b มีหรือไม่มี main_Role_ID หรือมีค่าเท่ากัน
            // เรียงตาม role_Name
            return a.role_Name.localeCompare(b.role_Name);
          }
        };

        results.sort(compareFunction);
        if (!isEqual(results, allRole)) {
          // Update state only if the data is different

          setAllRole(results);
        }

        // setListRelationship(results);
      } catch (error) {
        console.log("Catch Error :", error);
      }
    }
    fetchListRoleApproval();
  }, [allRole]);

  //ดึงข้อมูล Flow ทั้งหมด เมื่อ re-render setFlowStep(results);
  useEffect(() => {
    async function fetchFlowByID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchFlowStepByID",
          {
            flow_ID: params.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );

        const results = response.data.results;
        // if (results.length > 0 &&results[results.length - 1].step_Type !== "SendResponse") {
        //   // Clone the last object and increment its step_ID
        //   const lastStep = { ...results[results.length - 1] };

        //   const flow_ID = lastStep.flow_ID
        //   const step_ID = lastStep.step_ID += 1;
        //   const step_Type = lastStep.step_Type = "AddAction";
        //   const lastStepObject = {flow_ID,step_ID,step_Type}
        //   // Add the modified lastStep object to results array
        //   results.push(lastStepObject);
        // }

        console.log("fetch all step flow", results);
        setFlowStep(results);

        // const newListOrderOfSender = [];
        // // console.log(allRole)
        // results.forEach((item) => {
        //   if (item.step_ID === 0 && item.step_Type === "Initial") {
        //     const label = allRole.find(
        //       (role) => role._id === item.user_Role_ID
        //     )?.role_Name;
        //     newListOrderOfSender.push({ value: item.user_Role_ID, label });
        //   } else if (item.step_ID > 0 && item.step_Type === "Approval") {
        //     const label = allRole.find(
        //       (role) => role._id === item.role_Approver_ID
        //     )?.role_Name;
        //     newListOrderOfSender.push({ value: item.role_Approver_ID, label });
        //   }
        // });
        // console.log(newListOrderOfSender);
        // setListOrderOfSender(newListOrderOfSender);
      } catch (error) {
        console.log("catch error", error);
      }
    }
    fetchFlowByID();
  }, [allRole]);

  //ดึงข้อมูล ลำดับมา setListOrderOfSender(allOrderSender)
  useEffect(() => {
    async function fetchFlowInfoByFlowID() {
      const userData = JSON.parse(localStorage.getItem("userData"));
      try {
        const response = await axios.post(
          "http://localhost:5000/api/fetchFlowInfoByFlowID",
          {
            flow_ID: params.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + userData.token,
            },
          }
        );
        // console.log(response.data.results)
        setFlowInfo(response.data.results);
        setEditedFlowName(response.data.results.flow_Name);
        setListOrderOfSender(response.data.results.all_Order_Of_Sender_Role_ID);
      } catch (error) {
        console.log("Catch error =", error);
      }
    }
    fetchFlowInfoByFlowID();
  }, []);

  return (
    <div>
      <div className="container-edit-flow">
        {/* header มีแก้ไขชื่อ */}
        <div className="edit-flow-header">
          {isEditName ? (
            <button
              className="icon-edit-name-rela"
              title="บันทึก"
              onClick={() => handleChangeNameFlow()}
            >
              <MdOutlineSaveAlt />
              บันทึก
            </button>
          ) : (
            <button
              className="icon-edit-name-rela"
              title="แก้ไขชื่อความสัมพันธ์"
              onClick={() => setIsEditName(true)}
            >
              <MdOutlineEdit />
              แก้ไข
            </button>
          )}

          <p style={{ margin: "0" }}>Flow:</p>
          {isEditName ? (
            <div className="edit-name-frame">
              <input
                className="input-rela"
                type="text"
                value={editedFlowName}
                onChange={(e) => setEditedFlowName(e.target.value)}
              ></input>{" "}
            </div>
          ) : (
            <p style={{ margin: "0" }}>{flowInfo.flow_Name}</p>
          )}
        </div>
        {/* body Flowทั้งหมด */}
        <div className="space-edit-flow">
          {flowStep.map((item, index) => {
            // initial
            if (item.step_Type === "Initial" && item.step_ID === 0) {
              return (
                <div
                  key={index}
                  className={`all-box-initial ${
                    stepSelected[item.step_ID] ? "expanded-initial" : ""
                  }`}
                >
                  <div
                    className="initial-step"
                    onClick={() => handleStepFlowSelected2(item.step_ID)}
                  >
                    <div className="icon">
                      <IoDocumentTextOutline />
                    </div>
                    <div className="label">
                      {" "}
                      {item.step_ID + 1 + ")."} Initialize Document
                    </div>
                  </div>
                  {stepSelected[item.step_ID] && (
                    <div className="flex-cl pd1 over-y-auto box-init-doc">
                      <div className="flex-row pdb05">
                        <div className="fw-600 ">
                          เลือกRoleที่ต้องการให้ใช้เอกสาร :
                        </div>
                        <select
                          className="pd02 mgl05 w200"
                          value={item?.user_Role_ID}
                          onChange={(event) =>
                            handleChangeUserRoleID(index, event)
                          }
                        >
                          <option value="" disabled>
                            -
                          </option>
                          {allRole.map((role, index) => {
                            return (
                              <option key={role._id} value={role._id}>
                                {role.role_Name}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="fw-600 pdb05">
                        เพิ่มรายละเอียดที่เอกสารต้องการ:
                      </div>
                      {/* group btn */}
                      <div className="flex-row">
                        <button
                          className={
                            item.add_Text?.length !== 0
                              ? "btn-add-text-selected"
                              : "btn-add-text"
                          }
                          onClick={() => handleAddText(item.step_ID)}
                        >
                          <RxText style={{ fontSize: "15px" }} />
                          ข้อความเพิ่มเติม
                        </button>
                        <button
                          className={
                            item.add_Other_File?.length !== 0
                              ? "btn-add-text-selected"
                              : "btn-add-text"
                          }
                          onClick={() => handleAddFile(item.step_ID)}
                        >
                          <GoFile style={{ fontSize: "15px" }} />
                          ไฟล์เพิ่มเติม
                        </button>
                      </div>
                      <div>
                        {item.add_Text?.map((itemText, indexAddText) => {
                          return (
                            <div className="box-input-add-more font-13" key={indexAddText}>
                              <div className="flex-row jc-sb">
                                <div className="font-15">เพิ่มข้อความ</div>
                                <ImCross
                                  size={13}
                                  className="icon-del"
                                  onClick={() =>
                                    handleDelAddText(index, indexAddText)
                                  }
                                />
                              </div>
                              <div className="pd02">
                                ระบุหัวข้อที่ต้องการ:
                                <input
                                  className="font-13 pd02 mgl05 w250"
                                  type="text"
                                  required={true}
                                  placeholder="ระบุหัวข้อที่ต้องการ"
                                  value={itemText.topic}
                                  onChange={(event) =>
                                    handleChangeTopicAddText(
                                      index,
                                      indexAddText,
                                      event
                                    )
                                  }
                                />
                              </div>
                              <div className="pd02">
                                ระบุประเภทคำตอบ :
                                <select
                                  className="font-13 pd02 mgl05 w250"
                                  value={itemText.type_Answer || ""}
                                  onChange={(event) =>
                                    handleChangeTypeAnswerAddText(
                                      index,
                                      indexAddText,
                                      event
                                    )
                                  }
                                >
                                  <option value="" disabled>
                                    เลือกประเภทคำตอบ
                                  </option>
                                  {allTypeAnswer.map((type, typeIndex) => (
                                    <option key={typeIndex} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div>
                        {item.add_Other_File?.map((itemFile, indexAddFile) => {
                          return (
                            <div className="box-input-add-more font-13">
                              <div className="flex-row jc-sb ">
                                <div className="font-15">เพิ่มไฟล์อื่นๆ</div>
                                <ImCross
                                  size={13}
                                  className="icon-del"
                                  onClick={() =>
                                    handleDelAddFile(index, indexAddFile)
                                  }
                                />
                              </div>
                              <div className="pd02">
                                ระบุหัวข้อที่ต้องการ :
                                <input
                                  className="font-13 pd02 mgl05 w250"
                                  type="text"
                                  required={true}
                                  placeholder="ระบุหัวข้อที่ต้องการ"
                                  value={itemFile.topic}
                                  onChange={(event) =>
                                    handleChangeTopicAddFile(
                                      index,
                                      indexAddFile,
                                      event
                                    )
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              // Approval
              if (item.step_Type === "Approval") {
                console.log(item);
                return (
                  <div key={index}>
                    <div className="arrow-down">
                      <div className="line"></div>
                      <TbTriangleInvertedFilled className="head" />
                    </div>

                    <div
                      className={`all-box ${
                        stepSelected[item.step_ID] ? "" : ""
                      }`}
                    >
                      {/* ส่วนบน */}
                      <div
                        className="approve-step"
                        onClick={() => handleStepFlowSelected2(item.step_ID)}
                      >
                        <div className="icon">
                          <PiSealCheckFill />
                        </div>
                        <div className="label">
                          <div>{item.step_ID + 1 + ")."} Approval</div>
                          {index === flowStep.length - 2 &&
                            flowStep.length >= 2 &&
                            flowStep[flowStep.length - 1].step_Type !==
                              "SendResponse" &&
                            flowStep[flowStep.length - 2].step_Type ===
                              "Approval" && (
                              <FaExchangeAlt
                                className="icon-change-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToChangeAction("sec last");
                                }}
                              />
                            )}
                        </div>
                      </div>
                      {/* ส่วนขยาย */}
                      {stepSelected[item.step_ID] && (
                        <div className="approval-configue">
                          <div className="box-approval">
                            <div className="label">
                              เลือกความสัมพันธ์ระหว่างผู้ส่งกับผู้อนุมัติ :
                            </div>
                            <div className="select">
                              {/* Select ความสัมพันธ์ */}
                              <select
                                className="dropdown-relationship-id"
                                value={item.relationship_ID || ""}
                                onChange={(event) => {
                                  handleChangeRelationship(index, event);
                                }}
                              >
                                <option value="">-</option>
                                {/* {listRelationship.map((rel, relIndex) => (
                                  <option key={relIndex} value={rel._id}>
                                    {rel.relationship_Name}
                                  </option>
                                ))} */}
                                {listRelationship.map((rel, relIndex) => {
                                  const listOrderID = listOrderOfSender
                                    .slice(0, item.step_ID)
                                    .map((item) => item.value);
                                  // console.log(listOrderID)
                                  if (
                                    listOrderID.includes(rel.role_Sender_ID)
                                  ) {
                                    return (
                                      <option key={relIndex} value={rel._id}>
                                        {rel.relationship_Name}
                                      </option>
                                    );
                                  }
                                })}
                              </select>
                            </div>
                          </div>
                          {/* <div>{allRole.find(role => role._id === item.role_Approver_ID)?.role_Name}</div> */}
                          {/* Select เลือกผู้อนุมัติ ถ้าไม่มีความสัมพันธ์ จะ render */}
                          {!item.relationship_ID && (
                            <div className="box-approval">
                              <div className="label">เลือกผู้อนุมัติ :</div>
                              <div className="select">
                                <select
                                  className="dropdown-relationship-id"
                                  value={item.role_Approver_ID || ""}
                                  onChange={(event) => {
                                    handleChangeRoleApproval(index, event);
                                  }}
                                >
                                  <option value="" disabled>
                                    -
                                  </option>
                                  {allRole.map((role, roleIndex) => (
                                    <option key={roleIndex} value={role._id}>
                                      {role.role_Name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                          {/* ส่วนเพิ่มเติม */}
                          {/* <h1>{item.order_Of_Sender_Role_ID}</h1> */}
                          {/* ไม่มีความสัมพันธ์ */}
                          {item.role_Approver_ID && !item.relationship_ID && (
                            <div className="type1">
                              <div className="step1">
                                {/* <div className="label">
                                  ต้องการให้ผู้ใช้เลือกผู้อนุมัตินี้หรือไม่
                                </div> */}
                                {/* <div className="group-btn">
                                  <button
                                    className={
                                      item.is_User_Select === "userSelect"
                                        ? "btn-is-user-select-active"
                                        : "btn-is-user-select-non-active"
                                    }
                                    onClick={() =>
                                      handleUserSelectedOrNot(
                                        item.step_ID,
                                        "userSelect"
                                      )
                                    }
                                  >
                                    ใช่
                                  </button>
                                  <button
                                    className={
                                      item.is_User_Select === "userNotSelect"
                                        ? "btn-is-user-select-active"
                                        : "btn-is-user-select-non-active"
                                    }
                                    onClick={() =>
                                      handleUserSelectedOrNot(
                                        item.step_ID,
                                        "userNotSelect"
                                      )
                                    }
                                  >
                                    ไม่ใช่
                                  </button>
                                </div> */}
                              </div>
                              {(
                                <div className="step2">
                                  <div className="label">
                                    ระบุหัวข้อให้ผู้ใช้เลือก :
                                  </div>
                                  <div className="input-topic">
                                    <input
                                      type="text"
                                      required
                                      placeholder="หัวข้อในการให้ผู้ใช้เลือก"
                                      value={item?.topic_Send_To_Approve || ""}
                                      onChange={(event) =>
                                        handleChangeTopic(item.step_ID, event)
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* มีความสัมพันธ์ */}
                          {/* {item.role_Approver_ID && item.relationship_ID && (
                            <div className="type2">
                              <u>
                                <h4>รูปแบบการอนุมัติ</h4>
                              </u>
                              <div className="step1">
                                <div className="label">
                                  เลือกลำดับผู้ส่งที่มีความสัมพันธ์กับผู้อนุมัติ
                                  :
                                </div>
                                <div className="dropdown">
                                  <div className="select">
                                    {item.role_Approver_ID &&
                                      item.relationship_ID &&
                                      item.step_ID >= 1 && (
                                        <select
                                          className="dropdown-relationship-id"
                                          value={item?.order_Of_Sender_Role_ID}
                                          onChange={(event) => {
                                            handleChangeOrderOfSender(
                                              index,
                                              event
                                            );
                                          }}
                                        >
                                          <option value="" disabled>
                                            -
                                          </option>
                                          {listOrderOfSender.map(
                                            (order, orderIndex) => {
                                              if (orderIndex < item.step_ID) {
                                                return (
                                                  <option
                                                    key={orderIndex}
                                                    value={orderIndex}
                                                  >
                                                    {orderIndex + 1}.
                                                    {order.label}
                                                  </option>
                                                );
                                              }
                                            }
                                          )}
                                        </select>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )} */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else if (item.step_Type === "SendResponse") {
                return (
                  <div key={index}>
                    <div className="arrow-down">
                      <div className="line"></div>
                      <TbTriangleInvertedFilled className="head" />
                    </div>
                    <div
                      className={`all-box ${
                        stepSelected[item.step_ID] ? "" : ""
                      }`}
                    >
                      <div
                        className="send-response-step"
                        onClick={() => handleStepFlowSelected2(item.step_ID)}
                      >
                        <div className="icon">
                          <FiSend />
                        </div>
                        <div className="label">
                          Send Response to User
                          <FaExchangeAlt
                            className="icon-change-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToChangeAction("last");
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={index}>
                    <div className="arrow-down">
                      <div className="line"></div>
                      <TbTriangleInvertedFilled className="head" />
                    </div>
                    <div
                      key={index}
                      className={`all-box ${
                        stepSelected[item.step_ID] ? "expanded" : ""
                      }`}
                    >
                      <div
                        className="add-action-step"
                        onClick={() => handleStepFlowSelected2(item.step_ID)}
                      >
                        <div className="icon">
                          <FiPlusCircle />
                        </div>
                        <div className="label">Add Action</div>
                      </div>
                      {stepSelected[item.step_ID] && (
                        <div className="add-action-configue">
                          <div
                            className="btn-action-approve"
                            onClick={() =>
                              handleChangeActionFlow(index, "Approval")
                            }
                          >
                            <div className="icon">
                              <PiSealCheckFill />
                            </div>
                            <div className="label">Approval</div>
                          </div>
                          <div
                            className="btn-action-send-response"
                            onClick={() =>
                              handleChangeActionFlow(index, "SendResponse")
                            }
                          >
                            <div className="icon">
                              <FiSend />
                            </div>
                            <div className="label">Send Response</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            }
          })}
        </div>
        {/* ส่วนท้าย บันทึก */}
        <div className="edit-tool">
          <button className="cancel" onClick={() => handleOnClose()}>
            <RiArrowGoBackFill />
            ยกเลิก
          </button>
          <button
            className={isEditing ? "save" : "non-save"}
            onClick={() => handleSaveFlow()}
            disabled={!isEditing}
          >
            <AiOutlineSave />
            บันทึก
          </button>
        </div>
      </div>
      {/* ส่วน ขวาบน อาจจะเอาออก */}
      {/* <div style={{ position: "fixed", top: 100, right: 0 }}>
        <div>ลำดับผู้ส่ง</div>
        {listOrderOfSender.map((item, index) => {
          return (
            <div key={index}>
              {index + 1}. {item.label}
            </div>
          );
        })}
      </div> */}
    </div>
  );
};

export default EditFlow;
