CREATE TABLE borrower (
    loan_id INT AUTO_INCREMENT NOT NULL,
    id INT NOT NULL,
    proof VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    occupation VARCHAR(20) NOT NULL,
    reason VARCHAR(300) NOT NULL,
    address VARCHAR(150) NOT NULL,
    asset VARCHAR(100) NOT NULL,
    asset_value INT UNSIGNED NOT NULL,
    nominee VARCHAR(50) NOT NULL,
    nominee_proof VARCHAR(100) NOT NULL,
    loan_amount INT UNSIGNED NOT NULL,
    PRIMARY KEY (loan_id),
    CHECK (loan_amount <= asset_value),
    FOREIGN KEY (id) REFERENCES user(id)
);
