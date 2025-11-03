import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Modal,
} from "react-bootstrap";

const Home = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [records, setRecords] = useState([]);
  const [type, setType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [skip, setSkip] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch Companies
  const handleGetCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:4000/fetchData", {
        BaseUrl: baseUrl,
        Username: username,
        Password: password,
        Type: "companies",
      });
      if (res.data.status === "ok" && res.data.companies) {
        setCompanies(res.data.companies);
        alert("Companies loaded successfully!");
      } else {
        alert("No companies found.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch companies.");
    } finally {
      setLoading(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:4000/testConnection", {
        BaseUrl: baseUrl,
        Username: username,
        Password: password,
      });
      alert(res.data.message || "Connection successful!");
    } catch (err) {
      console.error(err);
      alert("Connection failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch Items or Fixed Assets
  const handleFetchData = async (fetchType, skipCount = 0) => {
    if (!companyName) {
      alert("Please select a company first.");
      return;
    }

    try {
      setLoading(true);
      setType(fetchType);
      const res = await axios.post("http://localhost:4000/fetchData", {
        BaseUrl: baseUrl,
        Username: username,
        Password: password,
        CompanyName: companyName,
        Type: fetchType,
        FilterValue: filterValue,
        Skip: skipCount,
        Top: 20,
      });

      if (res.data.status === "ok" && res.data.records) {
        setRecords(res.data.records);
        setSkip(skipCount);
        setShowModal(true);
      } else {
        alert(res.data.message || "No data found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Next / Previous Pagination
  const handleNext = () => handleFetchData(type, skip + 20);
  const handlePrevious = () => {
    if (skip >= 20) handleFetchData(type, skip - 20);
  };

  // Checkbox logic
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) setSelectedRecords(records.map((r) => r.No));
    else setSelectedRecords([]);
  };

  const handleSelectOne = (no) => {
    if (selectedRecords.includes(no)) {
      setSelectedRecords(selectedRecords.filter((n) => n !== no));
    } else {
      setSelectedRecords([...selectedRecords, no]);
    }
  };

  return (
    <Container className="mt-4">
      <h3 className="text-center mb-4">Business Central Data Fetcher</h3>

      <Form>
        {/* Config Section */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Base URL</Form.Label>
              <Form.Control
                type="text"
                placeholder="http://192.168.0.16:7048/SUNCONBC1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Administrator@domain.local"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row className="mb-3">
          <Col>
            <Button variant="secondary" onClick={handleTestConnection} disabled={loading}>
              Test Connection
            </Button>{" "}
            <Button variant="info" onClick={handleGetCompanies} disabled={loading}>
              Fetch Companies
            </Button>
          </Col>
        </Row>

        {/* Company + Filter */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Select Company</Form.Label>
              <Form.Select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={companies.length === 0}
              >
                <option value="">-- Select a Company --</option>
                {companies.map((comp, idx) => (
                  <option key={idx} value={comp.Name}>
                    {comp.Name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Start With (Filter)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Item No. starts with..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Data Buttons */}
        <Row className="mb-3">
          <Col>
            <Button variant="primary" onClick={() => handleFetchData("items")}>
              Fetch Items
            </Button>{" "}
            <Button variant="success" onClick={() => handleFetchData("FixedAssets")}>
              Fetch Fixed Assets
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Modal */}
      <Modal size="xl" show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {type === "items" ? "Items" : "Fixed Assets"} (Page {skip / 20 + 1})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                {type === "items" ? (
                  <>
                    <th>No</th>
                    <th>Description</th>
                    <th>Inventory</th>
                    <th>Purch_Unit_of_Measure</th>
                    <th>Unit_Cost</th>
                    <th>Last_Date_Modified</th>
                  </>
                ) : (
                  <>
                    <th>No</th>
                    <th>Description</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedRecords.includes(item.No)}
                      onChange={() => handleSelectOne(item.No)}
                    />
                  </td>
                  {type === "items" ? (
                    <>
                      <td>{item.No}</td>
                      <td>{item.Description}</td>
                      <td>{item.InventoryField}</td>
                      <td>{item.Purch_Unit_of_Measure}</td>
                      <td>{item.Unit_Cost}</td>
                      <td>{item.Last_Date_Modified}</td>
                    </>
                  ) : (
                    <>
                      <td>{item.No}</td>
                      <td>{item.Description}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="warning">Insert Selected</Button>
          <Button variant="secondary" onClick={handlePrevious} disabled={skip === 0}>
            Previous
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Home;
