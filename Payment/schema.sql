CREATE TABLE razorpay_transactions (
  id INT,
  loan_id INT,
  order_id VARCHAR(100) NOT NULL,
  payment_id VARCHAR(100),
  signature VARCHAR(255),
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES user(id),
  FOREIGN KEY (loan_id) REFERENCES borrower(loan_id)
);