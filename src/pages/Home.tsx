import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
          <Link
            className=""
            to="/AddCustomer"
          >
            link zu Add Customer
          </Link>
    </div>
  )
}
