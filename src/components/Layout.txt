import React from "react";
import NavBar from "./NavBar";
import Container from "react-bootstrap/Container";

function Layout({ children }) {
  return (
    <>
      <NavBar />
      <Container className="my-4">
        {children}
      </Container>
    </>
  );
}

export default Layout;
