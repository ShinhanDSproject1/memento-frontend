import Auth from "@/app/AuthProvider";
import Layout from "@/app/LayoutProvider";
import Modal from "@/app/ModalProvider";
import Query from "@/app/QueryProvider";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import Router from "./Router";
export default function App() {
  return (
    <Query>
      <Auth>
        <Layout>
          <Modal>
            <Router />
          </Modal>
        </Layout>
      </Auth>
    </Query>
  );
}
