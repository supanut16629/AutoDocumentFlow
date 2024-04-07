import React, { useState } from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 48 * 4.5 + 8,
      width: 500,
    },
  },
};


function SelectionAddUsers({ listUsers,personToAdd,setPersonToAdd }) {
  const handleChange = (event) => {
    const data = event.target.value
    setPersonToAdd(data);
  };
  return (
    <div>
      <FormControl sx={{ m: 1, width: 500 }}>
        <InputLabel id="demo-multiple-name-label">Name</InputLabel>
        <Select
          labelId="demo-multiple-name-label"
          id="demo-multiple-name"
          multiple
          value={personToAdd}
          onChange={handleChange}
          input={<OutlinedInput label="Name" />}
          MenuProps={MenuProps}
        >
            {listUsers.map((item,index) => (
            <MenuItem
              key={item._id}
              value={item._id}
            >
              {item.firstname} {item.surname}
            </MenuItem>
          ))}
        </Select>
        
      </FormControl>
    </div>
  );
}

export default SelectionAddUsers;
