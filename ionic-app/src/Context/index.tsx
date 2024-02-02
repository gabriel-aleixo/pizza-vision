import React, { createContext, useReducer, Dispatch, ReactNode } from "react";
import { Session, User } from "@supabase/gotrue-js/src/lib/types"
import { UserPhoto } from "../hooks/usePhotoGallery"

interface AppState {
  session: Session | null;
  user: User | null;
  email: string;
  phone: string;
  isError: boolean;
  isLoadingSession: boolean;
  isLoadingData: boolean;
  photos: UserPhoto[];
}

const initialState: AppState = {
  session: null, // supabase session variable
  user: null,
  email: "",
  phone: "",
  isError: false,
  isLoadingSession: true,
  isLoadingData: false,
  photos: [],
};

const resetState: Partial<AppState> = {
  session: null, // supabase session variable
  user: null,
  phone: "",
  isError: false,
  isLoadingSession: true,
  isLoadingData: false,
  photos: [],
};

type StateAction =
| {
    type: "SET_STATE";
    state: Partial<AppState>;
  }
| {
    type: "RESET_STATE";
  };


interface AppContext extends AppState {
  dispatch: Dispatch<StateAction>;
}

const Context = createContext<AppContext>(initialState as AppContext);

const { Provider } = Context;
export const ContextProvider: React.FC<{ children: ReactNode }> = (props) => {
  const reducer = (state: AppState, action: StateAction): AppState => {
    switch (action.type) {
      case "SET_STATE":
        return { ...state, ...action.state };
      case "RESET_STATE":
        return {...state, ...resetState};
      default:
        return { ...state };
    }
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Provider value={{ ...state, dispatch }}>{props.children}</Provider>;
};

export default Context;
