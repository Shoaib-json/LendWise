create table bankdetails (
    id int,
    name varchar(50) not null,
    bankName varchar(50) not null,
    account varchar(80),
    ifscCode varchar(50),
    FOREIGN KEY (id) REFERENCES user(id)
);