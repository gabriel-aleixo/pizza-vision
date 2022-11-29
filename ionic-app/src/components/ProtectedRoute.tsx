import React, { useEffect, useContext } from "react";
import Context from "../Context";
import { Route, Redirect, RouteProps } from "react-router";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const context = useContext(Context);

  // useEffect(() => {

  //   console.log(`loading protected route '${path}' with component ${Component?.name}`);
  // }, [Component, path, exact]);

  return (
    <Route
      {...rest}
      render={(props) =>
        context.session ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};
