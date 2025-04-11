import React from 'react';
import { Breadcrumb } from 'antd';
import { DatePicker, Space } from 'antd';



function Reservation() {
    const { RangePicker } = DatePicker;
    return (
        <div>
            <div>
                <Breadcrumb
                    separator=">"
                    items={[
                        {
                            title: 'Home',
                        },
                        {
                            title: '예약관리',
                            href: '',
                        },
                        
                    ]}
                />
            </div>
            <div>
                <RangePicker />
            </div>
        </div>
    );
}

export default Reservation;