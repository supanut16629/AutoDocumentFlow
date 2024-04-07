import { combineReducers } from '@reduxjs/toolkit';
import accountReducer from './slice/accountSlice';

const rootReducer = combineReducers({
    account: accountReducer,
})

export default rootReducer;